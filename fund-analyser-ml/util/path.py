from os.path import dirname, abspath

def project_root():
    return dirname(dirname(abspath(__file__)))
