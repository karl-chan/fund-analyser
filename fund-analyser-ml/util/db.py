from util.config import properties
from pymongo import MongoClient
from pymongo.uri_parser import parse_uri

mongo_uri = properties["db"]["mongo.uri"]
database = parse_uri(mongo_uri)["database"]

client = MongoClient(mongo_uri)
db = client[database]