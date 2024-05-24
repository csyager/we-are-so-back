import os
import json
import boto3
import logging
import string
import random

from decimal import Decimal

from boto3.dynamodb.conditions import Key

from flask import request
from flask_lambda import FlaskLambda

from validation import SetCoordsSchema, GetCoordsSchema, GetGameSchema

logger = logging.getLogger()
logger.setLevel('INFO')

EXEC_ENV = os.environ['EXEC_ENV']
REGION = os.environ['REGION_NAME']
COORDS_TABLE_NAME = os.environ['COORDS_TABLE_NAME']
GAMES_TABLE_NAME = os.environ['GAMES_TABLE_NAME']

SERVER_ERROR_MESSAGE = "Encountered an unexpected server exception."
VALIDATION_ERROR_MESSAGE = "Invalid input: {}"
UNPARSEABLE_INPUT_MESSAGE = "Input could not be parsed."

GAME_ID_LEN = 8

CORS_HEADERS = {
    "Access-Control-Allow-Headers" : "Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
}


class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return json.JSONEncoder.default(self, obj)


app = FlaskLambda(__name__)

if EXEC_ENV == 'local':
    dynamodb = boto3.resource('dynamodb', endpoint_url='http://dynamodb:8000')
else:
    dynamodb = boto3.resource('dynamodb', region_name=REGION)


def db_table(table_name: str):
    return dynamodb.Table(table_name)


@app.post('/game')
def create_game():
    logger.info("creating new game")
    table = db_table(GAMES_TABLE_NAME)
    table_item = {
        "game_id": create_game_id()
    }
    try:
        logger.info("Writing game to ddb")
        response = table.put_item(Item=table_item)
        logger.info("ddb response: " + str(response))
        return (
            table_item,
            201,
            CORS_HEADERS
        )
    except Exception as err:
        logger.error(
            "Caught exception writing to dynamodb table %s:  %s",
            table.name,
            err
        )
        return (
            json.dumps({'message': SERVER_ERROR_MESSAGE}),
            500,
            CORS_HEADERS
        )
    

def create_game_id():
    return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(GAME_ID_LEN))


@app.get('/game')
def get_game():
    logger.info("getting game")
    game_id = request.args.get('game_id')
    # validation
    get_game_schema = GetGameSchema()
    errors = get_game_schema.validate(request.args)
    if errors:
        return (
            json.dumps({'message': VALIDATION_ERROR_MESSAGE.format(errors)}),
            400,
            CORS_HEADERS
        )
    
    logger.info("requested game_id: " + game_id)
    table = db_table(GAMES_TABLE_NAME)
    try:
        logger.info("Getting data from dynamodb")
        response = table.query(
            KeyConditionExpression=Key('game_id').eq(game_id)
        )
        return (
            json.dumps({
                "Count": response.get("Count"),
                "Items": response.get("Items")
            }, cls=JSONEncoder),
            200,
            CORS_HEADERS
        )
    except Exception as err:
        logger.error(
            "Caught exception reading from dynamodb table %s:  %s",
            table.name,
            err
        )
        return (
            json.dumps({'message': SERVER_ERROR_MESSAGE}),
            500,
            CORS_HEADERS
        )



@app.post('/coords')
def set_coords():
    logger.info("setting coords")
    data = request.data
    logger.info("request data: " + data)
    try:
        payload = json.loads(request.data, parse_float=Decimal)
    except Exception as err:
        return (
            json.dumps({'message': UNPARSEABLE_INPUT_MESSAGE}),
            400,
            CORS_HEADERS
        )

    # validation
    set_coords_schema = SetCoordsSchema()
    errors = set_coords_schema.validate(payload)
    if errors:
        return (
            json.dumps({'message': VALIDATION_ERROR_MESSAGE.format(errors)}),
            400,
            CORS_HEADERS
        )
    
    table_item = {
        "game_id": payload.get("game_id"),
        "player_id": payload.get("player_id"),
        "x_coord": payload.get("x_coord"),
        "y_coord": payload.get("y_coord")
    }
    table = db_table(COORDS_TABLE_NAME)
    try:
        logger.info("Trying to write to ddb")
        response = table.put_item(Item=table_item)
        logger.info("ddb response: " + str(response))
        return (
            table_item,
            200,
            CORS_HEADERS
        )
    except Exception as err:
        logger.error(
            "Caught exception writing to dynamodb table %s:  %s",
            table.name,
            err
        )
        return (
            json.dumps({'message': SERVER_ERROR_MESSAGE}),
            500,
            CORS_HEADERS
        )
    

@app.get('/coords')
def get_coords():
    logger.info("getting coords")
    game_id = request.args.get('game_id')

    # validation
    get_coords_schema = GetCoordsSchema()
    errors = get_coords_schema.validate(request.args)
    if errors:
        return (
            json.dumps({'message': VALIDATION_ERROR_MESSAGE.format(errors)}),
            400,
            CORS_HEADERS
        )

    logger.info("requested game_id: " + game_id)
    table = db_table(COORDS_TABLE_NAME)
    try:
        logger.info("Getting data from dynamodb")
        response = table.query(
            KeyConditionExpression=Key('game_id').eq(game_id)
        )
        return (
            json.dumps({
                "Count": response.get("Count"),
                "Items": response.get("Items")
            }, cls=JSONEncoder),
            200,
            CORS_HEADERS
        )
    except Exception as err:
        logger.error(
            "Caught exception reading from dynamodb table %s:  %s",
            table.name,
            err
        )
        return (
            json.dumps({'message': SERVER_ERROR_MESSAGE}),
            500,
            CORS_HEADERS
        )

def lambda_handler(event, context):
    """Sample pure Lambda function

    Parameters
    ----------
    event: dict, required
        API Gateway Lambda Proxy Input Format

        Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format

    context: object, required
        Lambda Context runtime methods and attributes

        Context doc: https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html

    Returns
    ------
    API Gateway Lambda Proxy Output Format: dict

        Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    """

    # try:
    #     ip = requests.get("http://checkip.amazonaws.com/")
    # except requests.RequestException as e:
    #     # Send some context about this error to Lambda Logs
    #     print(e)

    #     raise e

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "hello world",
            # "location": ip.text.replace("\n", "")
        }),
    }
