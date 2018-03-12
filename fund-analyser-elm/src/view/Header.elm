module Header exposing (header)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Model exposing (..)
import Pages exposing (..)


header : Model -> Html Msg
header model =
    nav
        [ class "navbar navbar-toggleable-md navbar-light bg-faded" ]
        [ button
            [ class "navbar-toggler navbar-toggler-right"
            , type_ "button"
            , attribute "data-toggle" "collapse"
            , attribute "data-target" "#navbar-items"
            ]
            [ span
                [ class "navbar-toggler-icon" ]
                []
            ]
        , a
            [ class "navbar-brand"
            , href "#"
            ]
            [ text "Fund analyser"
            ]
        , div
            [ id "navbar-items"
            , class "collapse navbar-collapse"
            ]
            [ ul
                [ class "navbar-nav" ]
                (List.map
                    (headerItem model)
                    pages
                )
            ]
        ]


headerItem : Model -> Page -> Html Msg
headerItem model page =
    let
        active =
            model.page == page
    in
    li
        [ classList
            [ ( "nav-item", True )
            , ( "active", active )
            ]
        ]
        [ a
            [ class "nav-link"
            , href "#"
            , onClick (SwitchPage page)
            ]
            [ text (toString page)
            ]
        ]
