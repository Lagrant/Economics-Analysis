var mtx = [];

var readFile = function (ele) {
    if (typeof(FileReader) == 'undefined') {    //if not H5
        alert("Your browser is too old,please use Chrome or Firefox");
        return false;
    }
    try {
        var file = ele.files[0];
        if (!file) {
            alert("Please select a file");
            return false;
        }
        var fileName = file.name;
        var fileType = (fileName.substring(fileName.lastIndexOf(".")+1,fileName.length)).toLowerCase();
        if (fileName.lastIndexOf('.') === -1 || fileType !== 'csv') {
            alert('Only a csv file is accepted!');
            return false
        } 

        var reader = new FileReader();
        reader.readAsText(file, 'utf-8');
        reader.onload = function (evt) {
            getContent(evt.target.result);
        };
        reader.onerror = function (evt) {
            alert('Error in reading file');
        }
    } catch (Exception) {
        var fallBack = ieReadFile(ele.value);
        if (fallBack) {
            getContent(fallBack);
        } else {
            alert('Unable to read file');
        }
    }
}

///Reading files with Internet Explorer
function ieReadFile(filename) {
    try {
        var fso = new ActiveXObject('Scripting.FileSystemObject');
        var fh = fso.OpenTextFile(filename, 1);
        var contents = fh.ReadAll();
        fh.Close();
        return contents;
    } catch (Exception) {
        alert(Exception);
        return false;
    }
}

var getContent = function (content) {

    function buildDataMatrix(data) {
        var temp = {};
        var keys = d3.keys(data);
        for (let i = 1,len = keys.length; i < len; i++) {
            k = parseFloat(data[keys[i]]);
            if (!isNaN(k)) {
                temp[keys[i]] = k;
            }
        }
        mtx.push(temp);
    }
    
    mtx = [];
    d3.csv.parse(content, buildDataMatrix);
    var blocks = d3.keys(mtx[0]).length;
    height = width = blocks * size;
    d3.select('#vis')
        .style('width', (width + margin.left + margin.right) + 'px')
        .style('height', (height + margin.top + margin.bottom) + 'px');
}