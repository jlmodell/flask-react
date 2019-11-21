import pandas as pd


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
