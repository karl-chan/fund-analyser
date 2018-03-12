module App exposing (..)

import Body exposing (..)
import Constants exposing (..)
import Fund exposing (..)
import Header exposing (..)
import Html exposing (Html, div)
import HttpConn exposing (..)
import Model exposing (..)
import Pages exposing (..)
import Server exposing (..)


---- TYPEDEF ----


type alias Properties =
    { server : Server }


init : ( Model, Cmd Msg )
init =
    let
        model =
            { server = { origin = serverOrigin }
            , page = Home
            , funds = Nothing
            }
    in
    ( model
    , getFunds model Fund.defaultFields
    )



---- VIEW ----


view : Model -> Html Msg
view model =
    div []
        [ header model
        , body model
        ]



---- PROGRAM ----


main : Program Never Model Msg
main =
    Html.program
        { init = init
        , update = update
        , view = view
        , subscriptions = \_ -> Sub.none
        }
