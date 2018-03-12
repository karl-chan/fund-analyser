require('./main.css');
const Elm = require('./App.elm');

const root = document.getElementById('root');
const app = Elm.App.embed(root);

/* PORTS - ELM TO JS */
app.ports.notifyDatatable.subscribe(function() {
    $('.fund-performance-table').DataTable();
});