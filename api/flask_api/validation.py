from marshmallow import Schema, fields

class GetCoordsSchema(Schema):
    game_id = fields.Str(required=True)


class SetCoordsSchema(Schema):
    game_id = fields.Str(required=True)
    player_id = fields.Str(required=True)
    x_coord = fields.Number(required=True)
    y_coord = fields.Number(required=True)


class GetGameSchema(Schema):
    game_id = fields.Str(required=True)