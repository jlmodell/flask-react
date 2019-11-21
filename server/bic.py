import xlwings as xw
import pandas as pd
import os
import json
import xlwings as xw
from xlwings.constants import DeleteShiftDirection, Direction
from xlwings import constants, Range
import xlrd
import xlwt
import datetime
import xlsxwriter


def bic(po, path_to_excel, save_path):
    ''' Shape release schedule and use template to
    Build the rest of the forms '''
    _ = xw.Book(path_to_excel)
    sheet = _.sheets['Schedule']
    df = sheet['A2:Z500'].options(pd.DataFrame).value
    _.close()

    """ Shape df into done and ready lists """
    ready = df.loc[(df['Ready'] == "Y")]
    ready.columns = ["b", "c", "d", "e", "f", "Ready", "WC Ready", "Job Done", "Request", "k", "l", "Run Date/Time",
                     "n", "Item", "WC", "Tooling", "r", "Description", "Lot", "@", "Qty", "w", "x", "y", "Pallets"]

    """ prepare BIC forms template.xlsx """

    wb = xw.Book(os.path.join(os.getcwd(), "BIC_forms_template.xlsm"))
    excel = xw.apps.active

    """ schedule sheet TODO: alt to mongodb for building pallets over 4-5 days """

    scratch = wb.sheets['scratch']
    scratch.clear()
    scratch.range("A1").value = ready
    scratch.range('1:1').api.Delete(DeleteShiftDirection.xlShiftUp)

    xl_app = wb.app

    xl_app.macro("copy_to_schedule")()

    """ 09-54-03 - Add the Purchase Order to A1 & I1 """

    initial = wb.sheets['09-54-03']

    _ = ["A1", "I1"]

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
    review.range("E5").value = f'E{po}'

    _ = ["7", "8", "9", "10", "11", "12", "13", "14", "15", "16",
         "17", "18", "19", "20", "21", "22", "23", "24", "25", "26"]
    for x in _:
        review.range(f"Q{x}").clear()

    """ 10-12-01 - add PO to H4 with "E" """

    verification = wb.sheets['10-12-01']
    verification.range("H4").value = f'E{po}'

    ''' 100-01 - add PO to I9 with "E" '''

    insp_data_sheet = wb.sheets['100-01']
    insp_data_sheet.range("I9").value = f'E{po}'

    ''' 09-54-02 = add PO to C4, I4, C16, I16 '''

    indicators_fields = ['C4', 'I4', 'C16', 'I16']
    biological_indicators = wb.sheets['09-54-02']

    for x in indicators_fields:
        biological_indicators.range(f'{x}').value = po

    """ save wb to upload_folder && quit excel """

    wb.save(save_path)
    excel.quit()

    done_save = ready[(ready['Ready'] == "Y") & (ready['Job Done'] != "Y")]
    done_save = done_save[['Item', 'Lot', 'Qty', '@', 'Pallets']]

    return done_save


def bic_updater(po, bic_path_to_excel, path_to_excel, save_path):
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

    _ = xw.Book(path_to_excel)
    sheet = _.sheets['Schedule']
    df = sheet['A2:Z500'].options(pd.DataFrame).value
    _.close()

    """ Shape df into done and ready lists """
    ready = df.loc[(df['Ready'] == "Y")]

    ready.columns = ["b", "c", "d", "e", "f", "Ready", "WC Ready", "Job Done", "Request", "k", "l", "Run Date/Time",
                     "n", "Item", "WC", "Tooling", "r", "Description", "Lot", "@", "Qty", "w", "x", "y", "Pallets"]

    """ schedule sheet """

    scratch = wb.sheets['scratch']
    scratch.clear()
    scratch.range("A1").value = ready
    scratch.range('1:1').api.Delete(DeleteShiftDirection.xlShiftUp)

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
