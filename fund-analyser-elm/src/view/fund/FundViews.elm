module FundViews exposing (fundPerformanceTable)

import Dict exposing (..)
import Fund exposing (..)
import Html exposing (..)
import Html.Attributes exposing (..)
import Maybe exposing (..)
import Model exposing (..)
import String exposing (..)


fundPerformanceTable : Model -> Html Msg
fundPerformanceTable model =
    case model.funds of
        Nothing ->
            div [ class "container" ] [ text "Sorry, no funds have been loaded yet." ]

        Just funds ->
            div
                [ class "container" ]
                [ table
                    [ class "fund-performance-table table table-striped table-bordered"
                    ]
                    [ thead
                        []
                        [ tr
                            []
                            (List.map (\field -> th [] [ text field ]) Fund.defaultFields)
                        ]
                    , tbody
                        []
                        (List.map fundToRow funds)
                    ]
                ]


fundToRow : Fund -> Html Msg
fundToRow fund =
    tr
        []
        (List.map
            (fieldToCell fund)
            Fund.defaultFields
        )


fieldToCell : Fund -> String -> Html Msg
fieldToCell fund field =
    let
        cellText =
            case field of
                "isin" ->
                    fund.isin

                "name" ->
                    fund.name

                "type" ->
                    fund.type_

                "shareClass" ->
                    fund.shareClass

                "frequency" ->
                    fund.frequency

                "ocf" ->
                    toPercent fund.ocf

                "amc" ->
                    toPercent fund.amc

                "entryCharge" ->
                    toPercent fund.entryCharge

                "exitCharge" ->
                    toPercent fund.exitCharge

                _ ->
                    if startsWith "returns." field then
                        let
                            duration =
                                dropLeft 8 field

                            return =
                                case Dict.get duration fund.returns of
                                    Just (Just value) ->
                                        Just value

                                    _ ->
                                        Nothing
                        in
                        toPercent return
                    else
                        fieldToString Nothing
    in
    td [] [ text cellText ]


toPercent : Maybe Float -> String
toPercent f =
    case f of
        Nothing ->
            fieldToString Nothing

        Just f ->
            toString ((Basics.toFloat <| round <| f * 10000) / 100.0) ++ "%"


fieldToString : Maybe a -> String
fieldToString field =
    case field of
        Nothing ->
            "N/A"

        Just field ->
            toString field
