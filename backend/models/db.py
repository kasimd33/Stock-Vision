from pymongo import MongoClient
import os

client = MongoClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017/stockvision'))
db = client['stockvision']

users_col = db['users']
watchlist_col = db['watchlists']
