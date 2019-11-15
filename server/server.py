import os
from flask import Flask, render_template, send_from_directory, request
from flask_mail import Mail, Message
from werkzeug.utils import secure_filename
import pandas as pd
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), ".env"))

app = Flask(__name__, static_folder="../frontend/build")

path_to_upload = os.path.join(os.getcwd(), "uploads")

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

# Serve React App


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


@app.route('/helen_file', methods=["POST"])
def helen_file():
    month_dict = {
        "1": "January",
        "2": "February",
        "3": "March",
        "4": "April",
        "5": "May",
        "6": "June",
        "7": "July",
        "8": "August",
        "9": "September",
        "10": "October",
        "11": "November",
        "12": "December"
    }

    if request.method == "POST":
        _ = request.form["date"]
        year, month, __ = str(_).split("-")
        sheet_name = f"{month_dict[month]} {year}"

        file = request.files["file"]
        file_name = secure_filename(file.filename)
        file.save(os.path.join(app.config["UPLOAD_FOLDER"], file_name))

        df = pd.read_excel(os.path.join(
            app.config["UPLOAD_FOLDER"], file_name), sheet_name)
        df = df.query("item=='6417R1'")

        df.to_excel(os.path.join(
            app.config["UPLOAD_FOLDER"], f"6417R1 {sheet_name}.xlsx"))

        if request.form['email']:
            emails = request.form['email'].split(",")

            for email in emails:
                msg = Message(f"6417R1 {sheet_name}",
                              recipients=[email.strip()])
                msg.html = df.to_html()

                with app.open_resource(os.path.join(app.config["UPLOAD_FOLDER"], f"6417R1 {sheet_name}.xlsx")) as fp:
                    msg.attach(f"6417R1 {sheet_name}.xlsx",
                               "application/vnd.ms-excel", fp.read())

                mail.send(msg)

    return "Success"


if __name__ == "__main__":
    app.run(use_reloader=True, port=5000, threaded=True, debug=True)
