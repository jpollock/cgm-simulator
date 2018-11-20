"use strict";
var PubNub = require('pubnub');
var got = require('got');

// load the jquery/kitchen-sink example to see the bot in action
const join_time = 20000;
const leave_time = 30000;
const protocol = 'https'
const host = 'ps.pndsn.com';
//const host = 'balancer1g.bronze.aws-pdx-3.ps.pn';
const subscribe_key = readENV('PUBNUB_SUBSCRIBE_KEY');
//const subscribe_key = 'sub-c-cbb4a31e-7b26-11e8-8d30-2e062084a6af';


function readENV(varName, defaultValue) {
    //for some reason Azure uses this prefix, maybe there is a good reason
    var value = process.env['CUSTOMCONNSTR_' + varName]
        || process.env['CUSTOMCONNSTR_' + varName.toLowerCase()]
        || process.env[varName]
        || process.env[varName.toLowerCase()];

    return value || defaultValue;
}

var pubnub = new PubNub({
  publishKey : readENV('PUBNUB_PUBLISH_KEY'),
  subscribeKey : readENV('PUBNUB_SUBSCRIBE_KEY'),
  ssl: true
})

var channel = readENV('PUBNUB_CHANNEL');

function createNewSample(data) {
    var new_sample = []
    data.forEach(function(item) {
        var rate = 1 + (getRandomInt(0, 75)/100);    
        new_sample.push( Math.floor(item * rate));
    });
    return new_sample;


}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

var patient_bg_data_template_map = {};
patient_bg_data_template_map[1] = [356, 363, 373, 379, 375, 362, 355, 356, 367, 374, 380, 380, 382, 383, 384, 391, 401, 401, 393, 380, 364, 355, 352, 350, 345, 335, 327, 322, 324, 324, 322, 315, 309, 310, 307, 303, 293, 267, 250, 237, 230, 211, 190, 173, 159, 151, 155, 146, 136, 120, 103, 86, 73, 69, 69, 62, 74, 76, 81, 86, 99, 92, 105, 101, 87, 67, 65, 70, 77, 81, 82, 83, 83, 82, 87, 93, 101, 114, 129, 146, 162, 177, 192, 204, 218, 242, 249, 299, 319, 361, 395, 401, 401, 401, 401, 401, 389, 361, 334, 310, 292, 281, 284, 285, 291, 285, 270, 269, 266, 237, 209, 175, 143, 115, 88, 65, 58, 58, 68, 71, 71, 72, 72, 74, 76, 78, 81, 81, 84, 87, 88, 90, 92, 93, 93, 93, 93, 92, 91, 91, 91, 92, 93, 95, 97, 100, 102, 103, 105, 107, 108, 110, 111, 110, 110, 110, 110, 111, 111, 111, 111, 112, 114, 116, 118, 120, 117, 117, 118, 119, 122, 124, 125, 125, 124, 124, 124, 126, 127, 130, 132, 135, 140, 145, 149, 156, 160, 161, 163, 166, 169, 172, 173, 174, 175, 175, 176, 177, 177, 175, 173, 170, 165, 160, 154, 149, 144, 139, 133, 126, 121, 118, 117, 115, 115, 116, 119, 120, 124, 128, 133, 137, 141, 146, 151, 156, 159, 160, 162, 160, 158, 156, 154, 152, 149, 147, 146, 146, 146, 147, 150, 151, 150, 151, 152, 153, 158, 166, 175, 182, 186, 193, 202, 204, 199, 202, 212, 225, 247, 255, 262, 268, 273, 279, 288, 294, 302, 308, 314, 315, 313, 307, 300, 292, 281, 261, 244, 214, 169, 135, 113, 101, 100, 103, 106, 110, 113, 118];
patient_bg_data_template_map[2] = [178, 184, 190, 192, 198, 203, 206, 209, 213, 217, 223, 228, 234, 238, 242, 247, 252, 253, 259, 266, 269, 272, 276, 280, 286, 291, 297, 302, 308, 307, 306, 304, 301, 300, 297, 292, 291, 292, 290, 295, 307, 309, 312, 310, 308, 309, 312, 310, 308, 307, 300, 289, 281, 275, 268, 269, 267, 279, 278, 253, 221, 203, 182, 176, 170, 166, 161, 153, 151, 151, 148, 137, 115, 95, 87, 92, 100, 107, 116, 122, 129, 136, 143, 148, 154, 164, 175, 186, 198, 212, 224, 243, 261, 276, 292, 303, 309, 312, 313, 318, 323, 326, 323, 320, 307, 286, 267, 253, 237, 216, 197, 162, 144, 127, 110, 96, 94, 96, 106, 116, 118, 117, 118, 119, 118, 119, 120, 122, 123, 123, 125, 126, 127, 128, 128, 129, 129, 129, 129, 128, 127, 126, 126, 128, 127, 127, 129, 130, 127, 126, 124, 122, 121, 121, 121, 121, 120, 119, 117, 115, 116, 120, 123, 125, 126, 121, 125, 124, 123, 121, 120, 122, 128, 131, 131, 132, 135, 137, 138, 139, 141, 141, 143, 146, 149, 150, 149, 151, 154, 156, 157, 156, 157, 158, 160, 162, 161, 162, 164, 163, 164, 164, 164, 164, 164, 166, 169, 174, 178, 183, 187, 188, 189, 191, 191, 192, 191, 190, 188, 185, 182, 182, 180, 180, 182, 185, 188, 190, 195, 196, 202, 204, 207, 210, 213, 217, 220, 223, 225, 225, 228, 231, 236, 240, 241, 240, 241, 241, 238, 234, 230, 230, 235, 242, 247, 249, 243, 237, 230, 225, 228, 233, 232, 245, 258, 270, 276, 270, 269, 274, 287, 298, 275, 268, 265, 256, 241, 228, 218, 208, 204, 205, 205, 212, 220, 223, 223, 223];
patient_bg_data_template_map[3] = [302, 308, 307, 306, 304, 301, 300, 297, 292, 291, 292, 290, 295, 307, 309, 312, 310, 308, 309, 312, 310, 308, 307, 300, 289, 281, 275, 268, 269, 267, 279, 278, 253, 221, 203, 182, 176, 170, 166, 161, 153, 151, 151, 148, 137, 115, 95, 87, 92, 100, 107, 116, 122, 129, 136, 143, 148, 154, 164, 175, 186, 198, 212, 224, 243, 261, 276, 292, 303, 309, 312, 313, 318, 323, 326, 323, 320, 307, 286, 267, 253, 237, 216, 197, 162, 144, 127, 110, 96, 94, 96, 106, 116, 118, 117, 118, 119, 118, 119, 120, 122, 123, 123, 125, 126, 127, 128, 128, 129, 129, 129, 129, 128, 127, 126, 126, 128, 127, 127, 129, 130, 127, 126, 124, 122, 121, 121, 121, 121, 120, 119, 117, 115, 116, 120, 123, 125, 126, 121, 125, 124, 123, 121, 120, 122, 128, 131, 131, 132, 135, 137, 138, 139, 141, 141, 143, 146, 149, 150, 149, 151, 154, 156, 157, 156, 157, 158, 160, 162, 161, 162, 164, 163, 164, 164, 164, 164, 164, 166, 169, 174, 178, 183, 187, 188, 189, 191, 191, 192, 191, 190, 188, 185, 182, 182, 180, 180, 182, 185, 188, 190, 195, 196, 202, 204, 207, 210, 213, 217, 220, 223, 225, 225, 228, 231, 236, 240, 241, 240, 241, 241, 238, 234, 230, 230, 235, 242, 247, 249, 243, 237, 230, 225, 228, 233, 232, 245, 258, 270, 276, 270, 269, 274, 287, 298, 275, 268, 265, 256, 241, 228, 218, 208, 204, 205, 205, 212, 220, 223, 223, 212, 211, 210, 209, 208, 208, 207, 206, 205, 204, 203, 202, 201, 201, 200, 199, 198, 197, 196, 195, 195, 194, 193, 192, 191, 190, 189, 189];
patient_bg_data_template_map[4] = [96, 87, 87, 89, 96, 106, 116, 129, 135, 138, 142, 151, 156, 164, 160, 156, 148, 144, 143, 138, 132, 122, 118, 119, 122, 118, 125, 133, 138, 141, 144, 142, 138, 131, 130, 126, 125, 121, 115, 110, 114, 121, 164, 193, 216, 220, 236, 237, 236, 230, 221, 191, 157, 125, 100, 91, 78, 80, 89, 96, 103, 102, 104, 107, 107, 111, 114, 117, 120, 119, 119, 120, 126, 129, 126, 123, 121, 115, 113, 112, 108, 108, 110, 113, 118, 122, 124, 123, 117, 108, 93, 83, 77, 79, 89, 108, 131, 156, 171, 168, 164, 175, 185, 193, 190, 190, 175, 159, 139, 117, 95, 82, 82, 87, 87, 78, 63, 53, 52, 55, 56, 60, 65, 73, 74, 77, 77, 73, 72, 72, 73, 73, 72, 71, 71, 71, 74, 80, 85, 89, 91, 93, 95, 97, 101, 105, 108, 110, 112, 116, 119, 125, 130, 138, 142, 145, 149, 151, 153, 155, 154, 153, 152, 150, 148, 144, 144, 145, 146, 147, 148, 150, 157, 162, 165, 163, 162, 160, 155, 148, 141, 141, 147, 149, 147, 144, 143, 143, 142, 145, 154, 165, 170, 164, 154, 154, 153, 154, 155, 156, 157, 159, 159, 161, 165, 166, 167, 167, 167, 161, 165, 169, 177, 184, 184, 182, 179, 178, 174, 174, 179, 178, 174, 171, 166, 163, 160, 155, 148, 140, 132, 125, 121, 119, 119, 123, 124, 123, 123, 123, 122, 121, 121, 116, 110, 106, 102, 94, 87, 81, 75, 68, 76, 86, 97, 108, 117, 115, 105, 91, 86, 83, 85, 96, 99, 102, 105, 113, 118, 134, 157, 174, 191, 191, 178, 167, 158, 154, 149, 143, 135, 133, 126, 120, 114, 109, 103, 97];

var patient_bg_data_map = {};

var i;
var total_patient_count = readENV('PATIENT_COUNT');

for (i = 0; i < total_patient_count; i++) {
    var template_number = getRandomInt(1, 4);
    patient_bg_data_map['Patient' + (i+1)] = createNewSample(patient_bg_data_template_map[template_number]);
}
/*patient_bg_data_map['Patient1'] = patient1_bg_data;
patient_bg_data_map['Patient2'] = patient2_bg_data;
patient_bg_data_map['Patient3'] = patient3_bg_data;
patient_bg_data_map['Patient4'] = patient4_bg_data;

patient_bg_data_map['Patient5'] = createNewSample(patient1_bg_data);
patient_bg_data_map['Patient6'] = createNewSample(patient2_bg_data);
patient_bg_data_map['Patient7'] = createNewSample(patient3_bg_data);
patient_bg_data_map['Patient8'] = createNewSample(patient4_bg_data);*/

setInterval(function publishSampleMessage() {
    console.log("Since we're publishing on subscribe connectEvent, we're sure we'll receive the following publish.");

    var n= Date.now();
    var b = new Date();
    b.setUTCHours(0,0,0);

    var slot = ((n - b) / 6e4)/5;
    
    var patients = [];
    for (i = 0; i < total_patient_count; i++) {
        patients.push('Patient' + (i+1))
    }
    patients.forEach(function(item, index, array) {
        
        var i = patient_bg_data_map[item];
        
        var pos = Math.floor(slot)
        var bg_v = i[pos];
        var rate = 1 + Math.floor(Math.random() * 5)/100;
        var bg_p = { "amount": null, "time": null };

        if (pos > i.length - 5) {
            bg_p["amount"] = -(bg_v - i[5 -(i.length - pos)]);
            bg_p["time"] = 30;
        } else {
            bg_p["amount"] = -(bg_v - i[pos + 5]);
            bg_p["time"] = 30;

        }
        //console.log(i[pos] + ' ' + i[pos + 5] + ' ' + (i[pos] -  i[pos + 5]));
        var bg = {
            //"value": Math.floor(bg_v * rate),
            "value": bg_v,
			"timestamp": n,
			"prediction": bg_p,
			"source": item,
			"type": "bg"
        };

        pubnub.publish({
            "channel": item,
            "message": bg,
            "meta": bg
        }, function(status, response) {
            //console.log(status, response);
        })
        
    });    
},readENV('MESSAGE_SEND_TIME'));

/*
setInterval(function setState() {

    var n= Date.now();
    var b = new Date();
    b.setUTCHours(0,0,0);

    var slot = ((n - b) / 6e4)/5;
    
    var patients = [];
    for (i = 0; i < total_patient_count; i++) {
        patients.push('Patient' + (i+1))
    }
    patients.forEach(function(item, index, array) {
        
        var i = patient_bg_data_map[item];
        
        var pos = Math.floor(slot)
        var bg_v = i[pos];
        var rate = 1 + Math.floor(Math.random() * 5)/100;
        var bg_p = { "amount": null, "time": null };

        if (pos > i.length - 5) {
            bg_p["amount"] = -(bg_v - i[5 -(i.length - pos)]);
            bg_p["time"] = 30;
        } else {
            bg_p["amount"] = -(bg_v - i[pos + 5]);
            bg_p["time"] = 30;

        }
        //console.log(i[pos] + ' ' + i[pos + 5] + ' ' + (i[pos] -  i[pos + 5]));
        var bg = {
            //"value": Math.floor(bg_v * rate),
            "value": bg_v,
			"timestamp": n,
			//"prediction": bg_p,
			"source": item,
            "type": "bg",
            "uuid": item
        };

        var newState = bg;

        var array = JSON.stringify(bg);
        bg = {
            //"value": Math.floor(bg_v * rate),
            "value": bg_v,
			"timestamp": n,
			//"prediction": bg_p,
			"source": item,
            "type": "bg",
            "uuid": item
        };


        array = JSON.stringify(bg);
/*        url = 'http://54.244.52.166/v2/presence/sub-key/sub-c-cbb4a31e-7b26-11e8-8d30-2e062084a6af/channel/cgm_data_new/uuid/' + item + '/data?&uuid=blah&state=' + encodeURIComponent(array);        
        //url = 'http://54.244.52.166/v2/presence/sub-key/sub-c-cbb4a31e-7b26-11e8-8d30-2e062084a6af/channel/,/uuid/' + item + '/data?channel-group=group1&uuid=blah&state=' + encodeURIComponent(array);        
        console.log(url)
//'http://balancer1g.bronze.aws-pdx-3.ps.pn/v2/presence/sub-key/sub-c-cbb4a31e-7b26-11e8-8d30-2e062084a6af/channel/foo/uuid/old/data?uuid=blah2&state=%7B%22age%22%3A+100%7D        
        request(url, {
            json: true
            }, function (err, data) {
            if (err) {
                console.log(err)
            } else {
              console.log(data)
            }
            
            // the JSON result
            
        })*/
/*        
        var url = protocol + '://' + host + '/v2/presence/sub-key/' + subscribe_key + '/channel/'+item+'/uuid/' + item + '/data?&uuid=blah&state=' + encodeURIComponent(array);        
        //url = 'http://54.244.52.166/v2/presence/sub-key/sub-c-cbb4a31e-7b26-11e8-8d30-2e062084a6af/channel/,/uuid/' + item + '/data?channel-group=group1&uuid=blah&state=' + encodeURIComponent(array);        
        //console.log(url)
//'http://balancer1g.bronze.aws-pdx-3.ps.pn/v2/presence/sub-key/sub-c-cbb4a31e-7b26-11e8-8d30-2e062084a6af/channel/foo/uuid/old/data?uuid=blah2&state=%7B%22age%22%3A+100%7D        
        if (Math.floor(Math.random() * 50) > 25) {
            got(url, {json: true}).then( response => {
                //console.log(response.body);
            }).catch(error => {
                console.log(error.response.body);
            });
        }
    });    
},join_time);

*/

/*
setInterval(function setState() {

    var n= Date.now();
    var b = new Date();
    b.setUTCHours(0,0,0);

    var slot = ((n - b) / 6e4)/5;
    
    var patients = [];
    for (i = 0; i < total_patient_count; i++) {
        patients.push('Patient' + (i+1))
    }
    patients.forEach(function(item, index, array) {
        
        var i = patient_bg_data_map[item];
        
        var pos = Math.floor(slot)
        var bg_v = i[pos];
        var rate = 1 + Math.floor(Math.random() * 5)/100;
        var bg_p = { "amount": null, "time": null };

        if (pos > i.length - 5) {
            bg_p["amount"] = -(bg_v - i[5 -(i.length - pos)]);
            bg_p["time"] = 30;
        } else {
            bg_p["amount"] = -(bg_v - i[pos + 5]);
            bg_p["time"] = 30;

        }
        //console.log(i[pos] + ' ' + i[pos + 5] + ' ' + (i[pos] -  i[pos + 5]));
        var bg = {
            //"value": Math.floor(bg_v * rate),
            "value": bg_v,
			"timestamp": n,
			//"prediction": bg_p,
			"source": item,
            "type": "bg",
            "uuid": item
        };

        var newState = bg;
/*
        pubnub.setState({
            state: newState,
            channels: ['cgm_data']
        }).then((response) => { 
            console.log(response) 
        }).catch((error) => { 
            console.log(error)
        });*/
/*
        var array = JSON.stringify(bg);
        /*
        var url = 'http://54.244.52.166/v2/presence/sub-key/sub-c-cbb4a31e-7b26-11e8-8d30-2e062084a6af/channel/cgm_data/uuid/' + item + '/data?uuid=blah&state=' + encodeURIComponent(array);        
        
        console.log(url)
        request(url, {
            json: true
            }, function (err, data) {
                if (err) {
                    console.log(err)
                } else {
                    console.log(data)
                }
            })
            */
            /*
            if (Math.floor(Math.random() * 50) > 25) {
                var url = protocol + '://' + host + '/v2/presence/sub-key/' + subscribe_key + '/channel/'+item+'/leave?uuid='+item;        
                //console.log(url)
                got(url, {json: true}).then( response => {
                    //console.log(item + " >>> " + response.body);
                }).catch(error => {
                    console.log(error.response.body);
                });

        
            }

            
    });    
},leave_time);
*/


const express = require('express')
const app = express()
const PORT = process.env.PORT || 5000

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(PORT, () => console.log('Example app listening on port =' + PORT + ' !'))