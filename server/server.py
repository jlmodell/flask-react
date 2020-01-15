from helperfuncs import helen_file, bic, bic_updater, idle, planning, email_file, tracings
import os
import sys
from redis import Redis
from rq import Queue
from rq.job import Job
from flask import Flask, render_template, send_from_directory, request, jsonify
from flask_mail import Mail, Message
from werkzeug.utils import secure_filename
import pandas as pd
from dotenv import load_dotenv
import threading
import datetime

sem = threading.Semaphore()

load_dotenv(os.path.join(os.getcwd(), ".env"))

port = 5000 if sys.argv[1] == "dev" else 3636
path_to_upload = os.path.join(os.getcwd(), "uploads")

app = Flask(__name__, static_folder="./frontend/build",
            template_folder="./frontend/build")

# import helper functions after app is created

app.config['UPLOAD_FOLDER'] = path_to_upload

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

app.config['MAIL_SERVER'] = "smtp.siteprotect.com"
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = "visifaxserver@busseinc.com"
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = app.config['MAIL_USERNAME']

mail = Mail(app)

"""
Helper BEGIN

"""

month_dict = {
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December"
}

"""
Helper END
"""


# Serve React App


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Helen File


@app.route("/api/helen_file", methods=["GET", "POST"])
def api_helen_file():
    if request.method == "POST":

        sem.acquire()

        _ = request.form['date']
        year, month, __ = str(_).split("-")
        sheet_name = f"{month_dict[month]} {year}"

        if "file" in request.files:
            file = request.files['file']
            file_name = secure_filename(file.filename)
            file.save(os.path.join(app.config["UPLOAD_FOLDER"], file_name))

        excel_filename = secure_filename(f"6417R1 {sheet_name}.xlsx")

        if "file" in request.files:
            _ = os.path.join(app.config["UPLOAD_FOLDER"], file_name)
        else:
            _ = os.path.join(r"//busse1/fs1/data", "MGM.xls")

        emails = ""

        if "email" in request.form:
            emails = request.form['email']

        helen_file(_, sheet_name,
                   app.config['UPLOAD_FOLDER'], excel_filename, emails)

        sem.release()

        return jsonify({"result": excel_filename})

    return jsonify({"result": "api_helen_file_as_GET"})

# BIC


@app.route("/api/bic", methods=["GET", "POST"])
def api_bic():
    bic_today = datetime.datetime.now()
    timestamp = bic_today.strftime("%Y%m%d%H%M%S")

    if request.method == "POST":
        sem.acquire()

        date = request.form['date']
        date = str(date).replace("-", "")

        po = request.form['po']

        file = request.files['file']
        file_name = secure_filename(f"release schedule {timestamp}.xls")
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], file_name))

        path_to_excel = os.path.join(
            app.config['UPLOAD_FOLDER'], file_name)

        unencrypted_path = secure_filename(os.path.join(
            app.config['UPLOAD_FOLDER'], f"unencrypted {file_name}"
        ))

        """ Logic Check to see if updating file or creating a new file """
        if 'bicFile' in request.files:
            bicFile = request.files['bicFile']
            bic_file_name = secure_filename("updated " + bicFile.filename)

            bic_path_to_excel = os.path.join(
                app.config['UPLOAD_FOLDER'], bic_file_name)

            excel_filename = secure_filename(
                f"E{po} updated BIC {date} {timestamp}.xlsm")

            save_path = os.path.join(
                app.config["UPLOAD_FOLDER"], excel_filename)

            bicFile.save(bic_path_to_excel)

            df = bic_updater(po, bic_path_to_excel,
                             path_to_excel, save_path, unencrypted_path)

        else:
            excel_filename = secure_filename(
                f"E{po} BIC {date} {timestamp}.xlsm")

            save_path = os.path.join(
                app.config["UPLOAD_FOLDER"], excel_filename)

            df = bic(po, path_to_excel, unencrypted_path, save_path)

        if request.form['email']:
            msg = Message(excel_filename.split(
                ".")[0], recipients=request.form['email'].split(","))
            msg.html = df.to_html()

            with app.open_resource(save_path) as fp:
                msg.attach(
                    excel_filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fp.read())
                mail.send(msg)

        sem.release()

        return jsonify({"result":  excel_filename})
    return jsonify({"result": "api_bic_as_GET"})


"""
Planning So Cust Kit shaping for Heber Menjivar
"""


@app.route("/api/planning", methods=["GET", "POST"])
def api_planning():
    if request.method == "POST":
        sem.acquire()

        if request.files['file']:
            file = request.files['file']
            file_name = secure_filename(file.filename)
            path_to_file = os.path.join(app.config['UPLOAD_FOLDER'], file_name)
            file.save(path_to_file)

        df = planning(path_to_file)

        today = datetime.datetime.now()
        timestamp = today.strftime("%Y%m%d%H%M%S")

        excel_filename = secure_filename(f'Planning {timestamp}.xlsx')

        save_path = os.path.join(
            app.config['UPLOAD_FOLDER'], excel_filename)

        df.to_excel(save_path)

        if request.form['email']:
            msg = Message(excel_filename.split(
                ".")[0], recipients=request.form['email'].split(","))
            msg.html = df.to_html()

            with app.open_resource(save_path) as fp:
                msg.attach(
                    excel_filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fp.read())

                mail.send(msg)

        sem.release()

        return jsonify({"result": excel_filename, "html": df.to_html()})
    return jsonify({"result": "api_planning_as_GET"})


'''
Idle Report
'''


@app.route("/api/idle", methods=["GET", "POST"])
def api_idle():
    if request.method == "POST":
        sem.acquire()

        if 'file' in request.files:
            file = request.files['file']
            file_name = secure_filename(file.filename)
            path_to_file = os.path.join(app.config['UPLOAD_FOLDER'], file_name)
            file.save(path_to_file)

        today = datetime.datetime.now()
        timestamp = today.strftime("%Y%m%d%H%M%S")

        excel_filename = secure_filename(f'Idle Cost Report {timestamp}.xlsx')
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], excel_filename)

        wage = request.form['wage'] if request.form['wage'] else "13.00"

        df = idle(path_to_file, wage)
        df.to_excel(save_path)

        sumOfIdleCost = 0 if df['idle_time_dollars'].sum(
        ) >= 0 else df['idle_time_dollars'].sum()
        projAnnualCost = sumOfIdleCost * 4 * 50

        if request.form['email']:
            msg = Message(excel_filename.split(
                ".")[0], recipients=request.form['email'].split(","))
            msg.html = df.to_html()

            with app.open_resource(save_path) as fp:
                msg.attach(
                    excel_filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fp.read())

                mail.send(msg)

        sem.release()

        return jsonify({"result": excel_filename, "html": df.to_html(), "sum_idle": sumOfIdleCost, "proj_annual": projAnnualCost})

    return jsonify({"result": "api_idle_as_GET"})


"""
Tracings for Ray
"""


@app.route("/api/tracings", methods=["GET", "POST"])
def api_tracings():
    if request.method == "POST":
        sem.acquire()

        item = request.form['item']
        months = request.form['months'].split(',')
        excel_filename = secure_filename(
            f'{item} Trace {datetime.datetime.now().strftime("%Y%m%d%H%M%S")}.xlsx')

        if request.form['email']:
            emails = request.form['email']
        else:
            emails = ''

        df = tracings(months, item, excel_filename, emails)

        sem.release()

        return jsonify({"result": excel_filename, "html": df.to_html()})
    return jsonify({"result": "api_tracings_as_GET"})


"""
download route
"""


@app.route("/download/<filename>")
def download(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename, as_attachment=True)


if __name__ == "__main__":
    app.run(host="0.0.0.0", use_reloader=True,
            port=port, threaded=True, debug=True)
