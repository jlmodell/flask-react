import pandas as pd
import sys
import csv


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
