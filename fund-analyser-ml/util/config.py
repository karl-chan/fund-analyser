import configparser

PROPERTIES_FILE = "app.properties"

properties = configparser.ConfigParser()
properties.read(PROPERTIES_FILE)