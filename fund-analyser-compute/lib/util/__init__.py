import configparser
import os

# Initialisation code for properties.py
def _init_properties():
    parser = configparser.ConfigParser()
    parser.read(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../app.properties")))
    return parser

PROPERTIES_FILE = _init_properties()