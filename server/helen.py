import pandas as pd


def helen_file(excelfile, sheetname):
    df = pd.read_excel(excelfile, sheetname)
    df = df.query("item=='6417R1'")

    return df
