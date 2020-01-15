from celery import Celery
import csv
import sys
import pandas as pd
import xlwings as xw
import os
import json
import xlwings as xw
from xlwings.constants import DeleteShiftDirection, Direction
from xlwings import constants, Range
import xlrd
import xlwt
import datetime
import xlsxwriter
from flask import Flask
from flask_mail import Mail, Message
from dotenv import load_dotenv
import msoffcrypto
import datetime

load_dotenv(os.path.join(os.getcwd(), ".env"))
path_to_upload = os.path.join(os.getcwd(), "uploads")


# helper_funcs = Celery('helper_funcs', backend='rpc://',
#                       broker='amqp://localhost')

# celery -A server.celery worker -l info -P eventlet


# config mail

app = Flask(__name__)

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

app.config['CELERY_BROKER_URL'] = 'amqp://localhost'
app.config['CELERY_RESULT_BACKEND'] = 'amqp://localhost'

celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)

##


def email_file(excel_filename, emails, df):
    emails = emails.split(",")
    emails = [x.strip() for x in emails]

    msg = Message(excel_filename.split(".")[0], recipients=emails)

    msg.html = df.to_html()

    with app.open_resource(os.path.join(app.config['UPLOAD_FOLDER'], excel_filename)) as fp:
        msg.attach(
            excel_filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fp.read())

    mail.send(msg)


# @celery.task
def helen_file(excelfile, sheetname, upload_folder, excel_filename, emails):
    df = pd.read_excel(excelfile, sheetname)
    df = df.query("item=='6417R1'")
    df.to_excel(os.path.join(upload_folder, excel_filename))

    email_file(excel_filename, emails, df)

    return excel_filename


# @celery.task
def idle(path_to_file, wage):
    df = pd.read_excel(path_to_file, usecols=[0, 10, 18, 19], names=[
        'center', 'crew_size', 'std_setup', 'act_setup'])
    df = df[1:-1]
    df = df.fillna(0)
    df = df[df['center'] != 0]
    df = df.astype(
        {'crew_size': 'float', 'std_setup': 'float', 'act_setup': 'float'})
    df = df.groupby(df['center']).aggregate(
        {'crew_size': 'max', 'std_setup': 'sum', 'act_setup': 'sum'})
    df['idle_time_dollars'] = (
        df['std_setup'] - df['act_setup']) * float(wage) * df['crew_size']

    return df


# @helper_funcs.task
def planning(path_to_file):
    with open(path_to_file, 'r') as f:
        t = f.read()
        f.close()
        with open(path_to_file, 'w') as f:
            f.write('"","","","","","","",""\n')
            f.write(t)
            f.close()

    if '.txt' in path_to_file:
        df = pd.read_csv(path_to_file, sep='\t', usecols=[0, 1, 2, 6, 7], names=[
            'item', 'so', 'wo', 'wip', 'oh'])
    else:
        df = pd.read_csv(path_to_file, usecols=[0, 1, 2, 6, 7], names=[
            'item', 'so', 'wo', 'wip', 'oh'])

    df = df[:-1]
    df = df.fillna(0)
    df = df.astype({'so': 'float', 'wo': 'float',
                    'wip': 'float', 'oh': 'float'})
    df = df.groupby(df['item']).aggregate(
        {'so': 'sum', 'wo': 'sum', 'wip': 'sum', 'oh': 'sum'})
    df = df[df['so'] != df['wo'] + df['wip'] + df['oh']]
    df = df[df['so'] <= 10000]

    return df


def unencrypt_excel(path_to_excel, unencrypted_path):
    _ = msoffcrypto.OfficeFile(open(path_to_excel, "rb"))
    _.load_key(password="VelvetSweatshop")
    _ = _.decrypt(open(unencrypted_path, "wb"))

    _ = pd.read_excel(unencrypted_path, "Schedule", headers=True)
    _.columns = _.iloc[0]
    _.drop(_.index[0])

    # file to append to ['Schedule']
    ready = _.loc[_["Ready"] == "Y"]
    ready.columns = [
        "Requested",
        "WH Issue Date",
        "Pulled",
        "Posted",
        "Racks",
        "Parts Prep",
        "Ready",
        "WC Ready",
        "Job Done",
        "Request",
        "In Parts Prep by",
        "L",
        "Run Date/Time",
        "N",
        "Item",
        "WC",
        "Tooling",
        "R",
        "Description",
        "Lot",
        "@",
        "Qty",
        "Comments",
        "X",
        "MP",
        "Pallets",
    ]

    ready = ready.applymap(lambda x: str(
        x) if isinstance(x, datetime.time) else x)

    os.remove(unencrypted_path)

    return ready


def bic(po, path_to_excel, unencrypted_path, save_path):
    ''' Shape release schedule and use template to
    Build the rest of the forms '''
    # _ = xw.Book(path_to_excel)
    # sheet = _.sheets['Schedule']
    # df = sheet['A2:Z700'].options(pd.DataFrame).value
    # _.close()

    # """ Shape df into done and ready lists """
    # ready = df.loc[(df['Ready'] == "Y")]
    ready = unencrypt_excel(path_to_excel, unencrypted_path)
    # ready.columns = ["b", "c", "d", "e", "f", "Ready", "WC Ready", "Job Done", "Request", "k", "l", "Run Date/Time",
    #                  "n", "Item", "WC", "Tooling", "r", "Description", "Lot", "@", "Qty", "w", "x", "y", "Pallets"]

    """ prepare BIC forms template.xlsx """

    wb = xw.Book(os.path.join(os.getcwd(), "BIC_forms_template.xlsm"))
    excel = xw.apps.active

    """ schedule sheet TODO: alt to mongodb for building pallets over 4-5 days """

    scratch = wb.sheets['scratch']
    scratch.clear()
    scratch.range("A1").value = ready
    scratch.range('1:1').api.Delete(DeleteShiftDirection.xlShiftUp)
    scratch.range('A:A').api.Delete(DeleteShiftDirection.xlShiftToLeft)

    xl_app = wb.app

    xl_app.macro("copy_to_schedule")()

    """ 09-54-03 - Add the Purchase Order to A1 & I1 """

    initial = wb.sheets['09-54-03']

    _ = ["A1"]

    for x in _:
        initial.range(f'{x}').value = po

    """ 09-54-01 BIC """

    bic = wb.sheets['09-54-01 BIC']

    cols = ["B", "C", "D", "E", "E", "F",
            "G", "H", "I", "J", "K", "L", "M"]
    rows = ["12", "16", "20", "24"]

    formula_a = ["11", "15", "19", "23"]
    formula_b = ["13", "17", "21", "25"]

    for x in cols:
        for y in rows:
            bic.range(f"{x}{y}").clear()

    for x in cols:
        bic.range(f'{x}31').clear()

    for x in cols:
        for y in formula_a:
            bic.range(
                f'{x}{y}').formula = f'=IF(NOT(ISNA(INDEX(Schedule!$O:$O,MATCH({x}{str(int(y)+1)},Schedule!$T:$T,0)))), INDEX(Schedule!$O:$O,MATCH({x}{str(int(y)+1)},Schedule!$T:$T,0)), "")'

    for x in cols:
        for y in formula_b:
            bic.range(
                f'{x}{y}').formula = f'=IF(NOT(ISNA(INDEX(Schedule!$V:$V,MATCH({x}{str(int(y)-1)},Schedule!$T:$T,0)))), INDEX(Schedule!$V:$V,MATCH({x}{str(int(y)-1)},Schedule!$T:$T,0)), "")'

    bic.range("B33").value = f'E{po}'

    xl_app.macro("build_lots_list")()

    """ 09-54-04 Non Sterile Tag - add PO to H6 """

    tags = wb.sheets['09-54-04 Non Sterile Tag']
    tags.range("H6").value = po

    """ 10-08-01 = add PO to E5 with "E" and clear column Q data for new sheet """

    review = wb.sheets['10-08-01']
    review.range("E4").value = f'E{po}'

    _ = ["7", "8", "9", "10", "11", "12", "13", "14", "15", "16",
         "17", "18", "19", "20", "21", "22", "23", "24", "25", "26"]
    for x in _:
        review.range(f"Q{x}").clear()

    ''' EDIT 10-08-03 '''

    finished_product = wb.sheets['10-08-03']
    finished_product.range("C5").value = f'E{po}'

    """ 10-12-01 - add PO to H4 with "E" """

    verification = wb.sheets['10-12-01']
    verification.range("H4").value = f'E{po}'

    ''' 100-01 - add PO to I9 with "E" // removed per mary vera '''

    #insp_data_sheet = wb.sheets['100-01']
    #insp_data_sheet.range("I9").value = f'E{po}'

    ''' 09-54-02 = add PO to C4 '''

    indicators_fields = ['C4']
    biological_indicators = wb.sheets['09-54-02']

    for x in indicators_fields:
        biological_indicators.range(f'{x}').value = po

    ''' 09-54-02 Printing only = add PO to C4 '''

    indicators_fields = ['C4', 'I4', 'C16', 'I16']
    biological_indicators = wb.sheets['09-54-02 Printing only']

    for x in indicators_fields:
        biological_indicators.range(f'{x}').value = po

    """ save wb to upload_folder && quit excel """

    wb.save(save_path)
    excel.quit()

    done_save = ready[(ready['Ready'] == "Y") & (ready['Job Done'] != "Y")]
    done_save = done_save[['Item', 'Lot', 'Qty', '@', 'Pallets']]

    return done_save


def bic_updater(po, bic_path_to_excel, path_to_excel, save_path, unencrypted_path):
    ''' handle BIC form to update
    check PO # against PO # supplied by BIC form '''

    wb = xw.Book(bic_path_to_excel)
    excel = xw.apps.active

    _ = wb.sheets['09-54-03']
    bic_po = _.range("A1").value

    if po != str(int(bic_po)):
        excel.quit()
        return f"Error {po} was supplied, but does not match {bic_po} from BIC that was uploaded"

    ''' else, Shape release schedule and use template to
    Build the rest of the forms '''

    # _ = xw.Book(path_to_excel)
    # sheet = _.sheets['Schedule']
    # df = sheet['A2:Z500'].options(pd.DataFrame).value
    # _.close()

    # """ Shape df into done and ready lists """
    # ready = df.loc[(df['Ready'] == "Y")]

    # ready.columns = ["b", "c", "d", "e", "f", "Ready", "WC Ready", "Job Done", "Request", "k", "l", "Run Date/Time",
    #                  "n", "Item", "WC", "Tooling", "r", "Description", "Lot", "@", "Qty", "w", "x", "y", "Pallets"]

    ready = unencrypt_excel(path_to_excel, unencrypted_path)

    """ schedule sheet """

    scratch = wb.sheets['scratch']
    scratch.clear()
    scratch.range("A1").value = ready
    scratch.range('1:1').api.Delete(DeleteShiftDirection.xlShiftUp)
    scratch.range('A:A').api.Delete(DeleteShiftDirection.xlShiftToLeft)

    ''' call macro "copy_to_schedule" to update lots '''

    xl_app = wb.app
    xl_app.macro("copy_to_schedule")()
    xl_app.macro("rebuild_lots_list")()

    ''' build file name for updated bic '''

    wb.save(save_path)
    excel.quit()

    ''' create savefilename and done_save for display '''

    done_save = ready[(ready['Ready'] == "Y") & (ready['Job Done'] != "Y")]
    done_save = done_save[['Item', 'Lot', 'Qty', '@', 'Pallets']]

    return done_save


def tracings(months, item, excel_filename, emails):
    #
    df_cardinal = pd.concat(pd.read_excel(r"//busse1/fs1/data/Cardinal.xlsm", months,
                                          usecols=["g", "h", "i", "state", "item", "quant", "uom"], header=0), sort=True)
    df_cardinal['item'] = df_cardinal['item'].astype(str)
    df_cardinal = df_cardinal[df_cardinal['item'] == item]
    df_cardinal.columns = ["End User", "Address", "City",
                           "Item", "Quantity", "State", "UoM"]

    #
    df_ndc = pd.concat(pd.read_excel(r"//busse1/fs1/data/NDC.xlsm", months, usecols=["Ship-To Customer Name", "Ship-To Customer Address1",
                                                                                     "Ship-To Customer City", "Ship-To Customer State", "Vendor Item ID", "Quantity Shipped", "Units"], header=0), sort=True)
    df_ndc['Vendor Item ID'] = df_ndc['Vendor Item ID'].astype(str)
    df_ndc = df_ndc[df_ndc['Vendor Item ID'] == item]
    df_ndc.columns = ["Quantity", "Address", "City",
                      "End User", "State", "UoM", "Item"]

    #
    df_mgm = pd.concat(pd.read_excel(r"//busse1/fs1/data/MGM.xls", months,
                                     usecols=["name", "addr1", "addr3", "state", "item", "qty", "uom"], header=0), sort=True)
    df_mgm['item'] = df_mgm['item'].astype(str)
    df_mgm = df_mgm[df_mgm['item'] == item]
    df_mgm.columns = ["Address", "City", "Item",
                      "End User", "Quantity", "State", "UoM"]

    #
    df_medline = pd.concat(pd.read_excel(r'//busse1/fs1/data/Medline.xlsm', months, usecols=[
        "CustName", "CustStreet", "CustCity", "CustState", "code-item", "Quantity", "UoM"], headers=0), sort=True)
    df_medline['code-item'] = df_medline['code-item'].astype(
        float).fillna(0).astype(int).astype(str)
    df_medline = df_medline[df_medline['code-item'] == item]
    df_medline.columns = ["City", "End User", "State",
                          "Address", "Quantity", "UoM", "Item"]

    # final combined DF
    df = pd.concat([df_cardinal, df_ndc, df_mgm, df_medline], sort=True)

    df.to_excel(os.path.join(app.config['UPLOAD_FOLDER'], excel_filename))

    if emails != "":
        email_file(excel_filename, emails, df)

    return df
