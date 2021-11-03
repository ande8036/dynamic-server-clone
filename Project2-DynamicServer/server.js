// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

let app = express();
let port = 8000;

// Open usenergy.sqlite3 database
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

// Serve static files from 'public' directory
app.use(express.static(public_dir));


// GET request handler for home page '/' (redirect to /year/2018)
app.get('/', (req, res) => {
    res.redirect('/year/2018');
});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    console.log(req.params.selected_year);
    fs.readFile(path.join(template_dir, 'year.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        if(err)
        {
            res.status(404).send('Error: file not found');
        }
        else
        {
            let response = data.replace('{{{year here}}}', req.params.selected_year);
            db.all('SELECT state FROM usenergy ', [req.params.state[0]], (err, rows) => {
                // do we need a loop to replace all data in the table?
                /*
                    let i;
                    let data_items = '';
                    for(i = 0; i < rows.length; i++)
                    {
                        data_items += '<tr>' + rows[i].state + '</tr>\n';
                    }
                
                */
                response = response.replace('{{{data here}}}', data_items);
                res.status(200).type('html').send(response);
            });
        }
        res.status(200).type('html').send(template); // <-- you may need to change this
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    console.log(req.params.selected_state);
    fs.readFile(path.join(template_dir, 'state.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        if(err)
        {
            res.status(404).send('Error: file not found');
        }
        else
        {
        }

        res.status(200).type('html').send(template); // <-- you may need to change this
    });
});

// GET request handler for '/energy/*'
app.get('/energy/:selected_energy_source', (req, res) => {
    console.log(req.params.selected_energy_source);
    fs.readFile(path.join(__dirname, 'templates/energy.html'), 'utf-8', (err, data) => {
        if (err)
        {
            res.status(404).send('Error: file not found');
        }
        else {
            console.log("Connecting to database...");
            //console.log("Start of data:\n" + data + "\nEnd of Data");
            let response = data.replace(/{{{ENERGY_TYPE}}}/g, req.params.selected_energy_source);
            //response = data.replace('test1', req.params.selected_energy_source);
            //response = data.replace('test2', req.params.selected_energy_source);
            //console.log(req.params.selected_energy_source[0]);
            db.all('SELECT year from Consumption', (err, rows) => {
                console.log(rows);
                let i;
                let list_items = '';
                for (i = 0; i < rows.length; i++) {
                    list_items += '<li>' + rows[i].state_abbreviation + '</li>\n';
                }
                //response = response.replace('test2', list_items);
            });
            res.status(200).type('html').send(response);
        }
    })
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
