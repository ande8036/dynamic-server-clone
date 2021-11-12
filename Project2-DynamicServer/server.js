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
                
                if(rows.length == 0)
                {
                    res.status(404).send('Error: no data for year ' + req.params.selected_year);
                    return 0;
                }

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
            
            if(req.params.selected_state.length == 2) {
                response = response.replace('{{{state image here}}}', '/images/'+ req.params.selected_state +'.jpg" alt="Image of ' + req.params.selected_state + '" style="max-width: 10%; max-height: 10%;');
            } else {
                db.all('SELECT state_abbreviation FROM States WHERE state_name = ?', [req.params.selected_state], (err, state) => {
                    console.log(state[0].state_abbreviation);
                    response = response.replace('{{{state image here}}}', '/images/'+ state[0].state_abbreviation +'.jpg" alt="Image of ' + req.params.selected_state + '" style="max-width: 10%; max-height: 10%;');

                });
            }
            response = response.replace('{{{STATE}}}', req.params.selected_state);
            db.all('SELECT year, coal, natural_gas, nuclear, petroleum, renewable  FROM Consumption INNER JOIN States ON Consumption.state_abbreviation = States.state_abbreviation WHERE Consumption.state_abbreviation = ? OR state_name = ?', [req.params.selected_state, req.params.selected_state], (err, rows) => {
                //state,coal, natural gas, nuclear, petrol, renewable, total
                // make a coppy of every image with full name
                if(rows.length == 0)
                {
                    res.status(404).send('Error: no data for ' + req.params.selected_state);
                    return 0;
                }
                // do we need a loop to replace all data in the table?
                
                let i;
                let j;
                let data_items = '';
                let total = 0;
                let coal_total = [];
                let natural_gas_total = [];
                let nuclear_total = [];
                let petroleum_total = [];
                let renewable_total = [];
                for(i = 0; i < rows.length; i++)
                {
                    total += rows[i].coal + rows[i].natural_gas + rows[i].petroleum + rows[i].renewable;
                    data_items += '<tr>\n' + '<td>' + rows[i].year + '</td>\n' + '<td>' + rows[i].coal + '</td>\n' + '<td>' + rows[i].natural_gas + '</td>\n' + '<td>' + rows[i].nuclear + '</td>\n' + '<td>' + rows[i].petroleum + '</td>\n' + '<td>' + rows[i].renewable + '</td>\n' + '<td>' + total + '</td>\n' + '</tr>\n';
                    total = 0;
                    // dynamically generate totals for the graphs
                    coal_total[i] = rows[i].coal;
                    natural_gas_total[i] = rows[i].natural_gas;
                    nuclear_total[i] = rows[i].nuclear;
                    petroleum_total[i] = rows[i].petroleum;
                    renewable_total[i] = rows[i].renewable;
                }
                // coal total do a for loop that goes through rows and adds coal 
                
                //console.log(rows);
            response = response.replace('{{{COAL_COUNTS}}}', coal_total);
            response = response.replace('{{{NATURAL_GAS_COUNTS}}}', natural_gas_total);
            response = response.replace('{{{NUCLEAR_COUNTS}}}', nuclear_total);
            response = response.replace('{{{PETROLEUM_COUNTS}}}', petroleum_total);
            response = response.replace('{{{RENEWABLE_COUNTS}}}', renewable_total); 
            response = response.replace('{{{data here}}}', data_items);
            
            let coal_string = '';
            let nat_gas_string = '';
            let nuclear_string = '';
            let petroleum_string = '';
            let renewable_string = '';
            for (j = 0; j < 58; j++){
                coal_string += "{  y: "+coal_total[j]+ ", label: \""+(1960+j)+"\" },\n";
                nat_gas_string += "{  y: "+natural_gas_total[j]+ ", label: \""+(1960+j)+"\" },\n";
                nuclear_string += "{  y: "+nuclear_total[j]+ ", label: \""+(1960+j)+"\" },\n";
                petroleum_string += "{  y: "+petroleum_total[j]+ ", label: \""+(1960+j)+"\" },\n";
                renewable_string += "{  y: "+renewable_total[j]+ ", label: \""+(1960+j)+"\" },\n";
            }
            coal_string += "{  y: "+coal_total[58]+", label: \""+(1960+58)+"\" }";
            nat_gas_string += "{  y: "+natural_gas_total[58]+", label: \""+(1960+58)+"\" }";
            nuclear_string += "{  y: "+nuclear_total[58]+", label: \""+(1960+58)+"\" }";
            petroleum_string += "{  y: "+petroleum_total[58]+", label: \""+(1960+58)+"\" }";
            renewable_string += "{  y: "+renewable_total[58]+", label: \""+(1960+58)+"\" }";
            response = response.replace('{{{COAL_GRAPH_DATA}}}', coal_string);
            response = response.replace('{{{NATURAL_GAS_GRAPH_DATA}}}', nat_gas_string);
            response = response.replace('{{{NUCLEAR_GRAPH_DATA}}}', nuclear_string);
            response = response.replace('{{{PETROLEUM_GRAPH_DATA}}}', petroleum_string);
            response = response.replace('{{{RENEWABLE_GRAPH_DATA}}}', renewable_string);
                res.status(200).type('html').send(response);
            });
        }

    });
});

// GET request handler for '/energy/*'
app.get('/energy/:selected_energy_source', (req, res) => {
    fs.readFile(path.join(__dirname, 'templates/energy.html'), 'utf-8', (err, template) => {
        if (err)
        {
            res.status(404).send('Error: file not found');
        }
        else {
            let response;
            let energyType;
            if(req.params.selected_energy_source == "coal") {
                energyType = "Coal";
            } else if(req.params.selected_energy_source == "natural_gas") {
                energyType = "Natural Gas";
            } else if(req.params.selected_energy_source == "nuclear") {
                energyType = "Nuclear";
            } else if(req.params.selected_energy_source == "petroleum") {
                energyType = "Petroleum";
            } else if(req.params.selected_energy_source == "renewable") {
                energyType = "Renewable"
            }
            
            response = template.toString().replace('{{{energy here}}}', energyType);
            response = response.replace('{{{energy image here}}}', '../images/'+ req.params.selected_energy_source +'.jpg' + '" style="max-width: 10%; max-height: 10%;');
            response = response.replace('{{{ENERGY_TYPE}}}', req.params.selected_energy_source);
            let sqlQuery = 'SELECT year, state_abbreviation, ' + req.params.selected_energy_source  + ' FROM Consumption ORDER by year';
            db.all(sqlQuery, [], (err, rows) => {
                if(rows.length == 0)
                {
                    res.status(404).send('Error: no data for ' + req.params.selected_energy_source);
                    return 0;
                }
                else
                {
                    
                    let i;
                    let j;
                    let row_items = '';
                    let years = 1960;
                    let countin = 0;
                    let countout = 0;
                    var dict = {"AK":[], "AL":[], "AZ":[],"CO":[], "CT":[], "DC":[], "DE":[], "FL":[], "CA":[], "HI":[], "IA":[], "ID":[], "IL":[], "AR":[], "KS":[], "KY":[], "MA":[], "MD":[], "ME":[], "MI":[], "MN":[], "MO":[], "MS":[], "MT":[], "NC":[], "ND":[],
                     "NE":[], "NH":[], "NJ":[], "NM":[], "NV":[], "NY":[], "OH":[], "OK":[], "OR":[], "PA":[], "RI":[], "SC":[], "SD":[], "TN":[], "TX":[], "UT":[], "VA":[], "VT":[], "WA":[], "WI":[], "WV":[], "WY":[], "GA":[], "IN":[], "LA":[] };
                    
                    
                    for(i = 0; i < 59; i++)
                    { 
                        // check if we can add years manually
                        // check dictionary
                        row_items +=  '<tr>\n' +'<td>' + years + '</td>\n';
                        for(j = countout; j < rows.length; j++)
                        {
                            let row_state = rows[j].state_abbreviation;
                            dict[row_state].push(rows[j][req.params.selected_energy_source]);
                            row_items += '<td>' + rows[j][req.params.selected_energy_source] + '</td>\n';
                            if(countin == 50 )
                            {
                                countin = 0;
                                break;
                            }
                            countin++;
                        }
                        
                        countout += 51;
                        row_items += '</tr>\n';
                        years++;
                    }
                    
                    
                    console.log(rows);
                
                    

                    response = response.replace('{{{data here}}}', row_items);

                    let dataString = '';
                    let k;
                    //console.log(Object.keys(dict).length);
                    for(k = 0; k < Object.keys(dict).length; k++) {
                        dataString += '{\ntype: \"line\",\nindexLabelFontSize: 16,\nname: \"';
                        dataString += Object.keys(dict)[k];
                        dataString += '\",\ndataPoints: ['

                        //data here
                        let m;
                        for(m = 0; m < 59; m++){
                            dataString += '{ x: new Date(' + (1960 + m) + ', 01, 01), y: ';
                            dataString += dict[Object.keys(dict)[k]][m] + ' },';
                        }
                        dataString = dataString.substring(0, dataString.length - 1);
                        
                        dataString += ']},\n'
                    }
                    dataString = dataString.substring(0, dataString.length - 1);
                    console.log(dataString);

                    response = response.replace(/{{{ENERGY_COUNTS}}}/g, dataString);
                    res.status(200).type('html').send(response);
                }
                

            });
            
        }
    })
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
