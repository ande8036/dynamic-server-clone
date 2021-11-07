// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');
const { response } = require('express');


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
        //year,coal, natural gas, nuclear, petrol, renewable, total
        if(err)
        {
            res.status(404).send('Error: file not found');
        }
        else
        {
            let response = template.toString().replace('{{{year here}}}', req.params.selected_year);
            response = response.replace('{{{YEAR}}}', req.params.selected_year);
            
            db.all('SELECT state_abbreviation, coal, natural_gas, nuclear, petroleum, renewable FROM Consumption  WHERE year = ?', [req.params.selected_year], (err, rows) => {  
                
                    let i;
                    let data_items = '';
                    let total = 0;
                    let coal_total = 0;
                    let natural_gas_total = 0;
                    let nuclear_total = 0;
                    let petroleum_total = 0;
                    let renewable_total = 0;

                    for(i = 0; i < rows.length; i++)
                    {
                        total += rows[i].coal + rows[i].natural_gas + rows[i].petroleum + rows[i].renewable;
                        data_items += '<tr>\n' + '<td>' + rows[i].state_abbreviation + '</td>\n' + '<td>' + rows[i].coal + '</td>\n'+ '<td>' + rows[i].natural_gas + '</td>\n' + '<td>' + rows[i].nuclear + '</td>' + '<td>' + rows[i].petroleum + '</td>\n' + '<td>' + rows[i].renewable + '</td>\n' +  '<td>' + total + '</td>\n' +'</tr>\n';
                        total = 0;
                        // dynamically generate totals for the graphs
                        coal_total += rows[i].coal;
                        natural_gas_total += rows[i].natural_gas;
                        nuclear_total += rows[i].nuclear;
                        petroleum_total += rows[i].petroleum;
                        renewable_total += rows[i].renewable;
                    }

                    console.log(rows);
                response = response.replace('{{{COAL_COUNT}}}', coal_total);
                response = response.replace('{{{NATURAL_GAS_COUNT}}}', natural_gas_total);
                response = response.replace('{{{NUCLEAR_COUNT}}}', nuclear_total);
                response = response.replace('{{{PETROLEUM_COUNT}}}', petroleum_total);
                response = response.replace('{{{RENEWABLE_COUNT}}}', renewable_total);
                response = response.replace('{{{data here}}}', data_items);
                res.status(200).type('html').send(response);
            });       
        }    
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
            let response = template.toString().replace('{{{state here}}}', req.params.selected_state);
            response = response.replace('{{{state image here}}}', 'images/'+ req.params.selected_state +'.jpg');
            response = response.replace('{{{STATE}}}', req.params.selected_state);
            db.all('SELECT year, coal, natural_gas, nuclear, petroleum, renewable  FROM Consumption  WHERE state_abbreviation = ?', [req.params.selected_state], (err, rows) => {
                //state,coal, natural gas, nuclear, petrol, renewable, total
                
                // do we need a loop to replace all data in the table?
                
                    let i;
                    let data_items = '';
                    let total = 0;
                    let coal_total = 0;
                    let natural_gas_total = 0;
                    let nuclear_total = 0;
                    let petroleum_total = 0;
                    let renewable_total = 0;
                    for(i = 0; i < rows.length; i++)
                    {
                        total += rows[i].coal + rows[i].natural_gas + rows[i].petroleum + rows[i].renewable;
                        data_items += '<tr>\n' + '<td>' + rows[i].year + '</td>\n' + '<td>' + rows[i].coal + '</td>\n' + '<td>' + rows[i].natural_gas + '</td>\n' + '<td>' + rows[i].nuclear + '</td>\n' + '<td>' + rows[i].petroleum + '</td>\n' + '<td>' + rows[i].renewable + '</td>\n' + '<td>' + total + '</td>\n' + '</tr>\n';
                        total = 0;
                        // dynamically generate totals for the graphs
                        coal_total += rows[i].coal;
                        natural_gas_total += rows[i].natural_gas;
                        nuclear_total += rows[i].nuclear;
                        petroleum_total += rows[i].petroleum;
                        renewable_total += rows[i].renewable;
                    }
                    // coal total do a for loop that goes through rows and adds coal 
                    console.log(rows);
                response = response.replace('{{{COAL_COUNT}}}', coal_total);
                response = response.replace('{{{NATURAL_GAS_COUNT}}}', natural_gas_total);
                response = response.replace('{{{NUCLEAR_COUNT}}}', nuclear_total);
                response = response.replace('{{{PETROLEUM_COUNT}}}', petroleum_total);
                response = response.replace('{{{RENEWABLE_COUNT}}}', renewable_total); 
                response = response.replace('{{{data here}}}', data_items);
                res.status(200).type('html').send(response);
            });
        }

    });
});

// GET request handler for '/energy/*'
app.get('/energy/:selected_energy_source', (req, res) => {
    console.log(req.params.selected_energy_source);
    fs.readFile(path.join(__dirname, 'templates/energy.html'), 'utf-8', (err, template) => {
        if (err)
        {
            res.status(404).send('Error: file not found');
        }
        else {
            console.log("Connecting to database...");
            
            let response = template.toString().replace('{{{energy here}}}', req.params.selected_energy_source);
            db.all('SELECT state_abbreviation FROM Consumption WHERE year == 1960',  (err, cols) => {
                

                let i;
                let col_items = '';
                for(i = 0; i < cols.length; i++)
                {
                    col_items += '<tr>\n' + '<td>' + cols[i].state_abbreviation + '</td>\n' + '</tr>\n';
                }
                console.log(cols);
                response = response.replace('{{{state abreviations here}}}', col_items);
                res.status(200).type('html').send(response)
            });
            
        }
    })
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
