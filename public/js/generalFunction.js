/****************************************************************************************************/
/* String */
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function notCaseSensitiveSorting(a, b){
	a = a.toLowerCase();
	b = b.toLowerCase();
	var r = 0;
	if(a<b){
		r = -1;
	}else if(a>b){
		r = 1;
	}
	return r;
}

/****************************************************************************************************/
/* Human readable */
sizeUnits = ["B", "KB", "MB", "GB", "TB", "PB"];

function hrFileSize(size){ //Human readable size
    var unit = 0;

    while(size>=1024 && unit<sizeUnits.length-1){
        unit++;
        size = size/1024;
    }

	if(unit >= sizeUnits.length){
		unit = sizeUnits.length - 1;
	}

    return (Math.round(size*100)/100)+" "+sizeUnits[unit];
}
