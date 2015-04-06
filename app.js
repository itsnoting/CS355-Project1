// Module dependencies

var express    = require('express'),
    mysql      = require('mysql');

// Application initialization

var connection = mysql.createConnection({
    host     : 'cwolf.cs.sonoma.edu',
    user     : 'kting',
    password : '3668917'
});

var app = module.exports = express.createServer();

// Database setup

connection.query('USE kting', function (err) {
    if (err) throw err;
});

connection.query('SET SQL_SAFE_UPDATES = 0', function(err){
    if(err) throw err;
});

// Configuration

//GLOBAL VARIABLE
var loginID = null;
var StoreID = null;
var loggedinbool = false;
var orderedbool = false;
var order_num= null;
var AdminPriv = false;
app.use(express.bodyParser());

function handleError(res, err) {
    console.log(err);
    res.send(err.toString());
}

function isloggedin(res, loggedinbool){
    if(!loggedinbool){
	res.redirect("/");
	
    }
    return;
}

var htmlHeader = '<html><head><title>SCOREMORE!</title></head><body style="font-family: arial; align: center">';
var htmlFooter = '</body></html>';
var loggedinHeader;


app.get('/', function(req, res){
    if (order_num){
	res.redirect('/logout');
	return;
    }
    loginID=null;
    var responseHTML =  '<html><head><title>SCOREMORE!</title></head><body style=" text-align: center; line-height: 200px; vertical-align: center; font-family: arial">';
    responseHTML +=
	'<form action="/employee/login" method="GET" style="font-family: arial">' +
	'<label for="EmployeeID"</label>Employee <input type="int" name= "EmployeeID" id = "EmployeeID" /><br />' +
	'<input type="submit" value="Login"/>' +
	'</form>';
    responseHTML += htmlFooter;
    res.send(responseHTML);
});

app.get("/employee/login/invalid", function(req, res){
    loginID=null;
    var responseHTML = '<html><head><title>SCOREMORE!</title></head><body style=" text-align: center; line-height: 200px; vertical-align: center; font-family=arial">';;
    responseHTML +=
        '<form action="/employee/login" method="GET" style="font-family: arial">' +
        '<label for="EmployeeID"</label>Employee <input type="int" name= "EmployeeID\
" id = "EmployeeID" /><br />' +
        '<input type="submit" value="Login" />' +
        '</form>' +
	'<font color="red">   Invalid Employee Number</font>';
    responseHTML += htmlFooter;
    res.send(responseHTML);
});

app.get('/employee/login', function(req, res){
    var myQry = 'SELECT * FROM Employee';
    console.log(myQry);
    connection.query(myQry, function(err, Employee){
	if(err){
	    console.log(err);
	    res.redirect("/employee/login/invalid");
	}
	else{
	    for(var i = 0; i < Employee.length; i++){
		if (Employee[i].EmployeeID == req.query.EmployeeID){
		    loginID=req.query.EmployeeID
		    loggedinbool=true;
		    AdminPriv=Employee[i].Admin;
		    res.redirect('/store/');
		    return;
		    
		}
	    }
		res.redirect('/employee/login/invalid');
	}
    });
});

app.get('/logout', function(req, res){
    loggedinbool=false;
    if (orderedbool){
	res.redirect("/");
	return;
    }
    var myQry = "DELETE FROM Scoremore WHERE Date_Ordered is null";
    console.log(myQry);
    connection.query(myQry, function(err, Order){
	if(err){
	    console.log(err);
	    res.send("Darn");
	}
	else{
	    res.redirect("/");
	    order_num=null;
	}
    });
});

app.get('/employee/add', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var responseHTML= loggedinHeader;
    responseHTML += '<form action="/employee/insert" method="GET">' +
	'<label for="First_Name"</label>First Name:<input type="text" name="First_Name" id="First_Name" /><br />' +
	'<label for="Last_Name"</label>Last: Name<input type="text" name="Last_Name" id="Last_Name" /><br />' +
	'<label for="Admin" />Administrator:</label><br />' +
	'yes:<input type="radio" name="Admin" value=true />' +
	' no: <input type="radio" name="Admin" value=false /><br />' + 
	'<input type="submit" />' + '</form>' + htmlFooter;
    res.send(responseHTML);
});

app.get('/employee/insert', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    console.log("inserted");
    var InsertEmp = 'INSERT INTO Employee (First_Name, Last_Name, Admin) VALUES ("' +
	req.query.First_Name + '", "' +
	req.query.Last_Name + '", ' +
	req.query.Admin + ')';
    console.log(InsertEmp);
    connection.query(InsertEmp, function(err, Insert){
	if(err){
	    console.log(err);
	    res.send("Pooper");
	}
	else{
	    res.redirect('/employee');
	}
    });
});

app.get('/employee/delete', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var DelEmp = 'DELETE FROM Employee WHERE EmployeeID=' + req.query.EmployeeID;
    console.log(DelEmp);
    connection.query(DelEmp, function(err, del){
	if(err){
	    console.log(err);
	    res.send("pooper");
	}
	else{
	    res.redirect('/employee');
	}
    });
});

app.get('/employee', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    if(!AdminPriv){
	res.redirect("/restricted");
	return;
    }
    responseHTML = loggedinHeader + '<h1>Employees</h1><table border=1; align="center">';
    var EmployeeInfoQry = 
	"SELECT e.EmployeeID, e.First_Name, e.Last_Name, count(s.Date_Ordered) as Total_Items, IFNULL(SUM(IFNULL(p.Price, 0))/count(s.Date_Ordered), 0) as Average_Sales FROM" +
	" Employee as e LEFT JOIN Scoremore as s on e.EmployeeID=s.EmployeeID " +
	"LEFT JOIN Cart_Item AS c on c.OrderID=s.OrderID " +
        "LEFT JOIN Product AS p on c.UPC = p.UPC " +
	"GROUP BY e.EmployeeID";
    
    connection.query(EmployeeInfoQry, function(err, EmployeeInfo){
	if(err){
	    console.log(err);
	    res.send("Oh no!");
	}
	else{
	    responseHTML+= '<tr>' +
		'<th><!-- Employee Number --></th>' +
		'<th>First Name</th>' +
		'<th>Last Name </th>' +
		'<th>Total Items</th>' +
		'<th>Average Sales</th>' +
		'<th><!-- Edit --></th>' +
		'<th><!-- Terminate --></th></tr>';
	    for (var i =0; i < EmployeeInfo.length; i++){
		responseHTML+=
		'<tr><td>' + EmployeeInfo[i].EmployeeID + '</td>' +
		    '<td>' + EmployeeInfo[i].First_Name + '</td>' +
		    '<td>' + EmployeeInfo[i].Last_Name + '</td>' +
		    '<td>' + EmployeeInfo[i].Total_Items + '</td>' +
		    '<td>' + EmployeeInfo[i].Average_Sales + '</td>' +
		    '<td><a href="/employee/edit/?EmployeeID=' + EmployeeInfo[i].EmployeeID + '" >Edit</a></th>' +
		    '<td><a href="/employee/delete/?EmployeeID=' + EmployeeInfo[i].EmployeeID + '" >Delete</a></th></tr>';
	    }
	    responseHTML += '</table><a href="/employee/add" style=" text-align: left">Add New Employee</a>';
	    responseHTML += htmlFooter;
	    res.send(responseHTML);
	}
    });
});

app.get("/restricted", function(req, res){
    var responseHTML = loggedinHeader;
    responseHTML += '<h1>RESTRICTED ACCESS</h1>' + '<h2>Unfortunately you do not have administrative privliges on this account..</h2>' + htmlFooter;
    res.send(responseHTML);
});

app.get('/employee/edit', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var responseHTML = loggedinHeader;
    var EmployeeQry = "SELECT * FROM Employee WHERE EmployeeID = " + req.query.EmployeeID;
    console.log(EmployeeQry);
    connection.query(EmployeeQry, function(err, Employee){
	if(err){
	    console.log(err);
	    res.send("Darn");
	}
	else{
	    responseHTML += '<h1>' + Employee[0].First_Name + ' ' + Employee[0].Last_Name + '</h1>';
	    responseHTML += '<form action="/employee/update" method="GET">' +
		'<label for="First_Name">First Name:</label><input type="text" name="First_Name" id="First_Name" value="' + Employee[0].First_Name +'" /><br />' +
		'<label for="Last_Name">Last Name:</label><input type="text" name="Last_Name" id="Last_Name" value="' + Employee[0].Last_Name + '" /><br />';
	    if (AdminPriv){
		if (Employee[0].Admin){
		    responseHTML +='<label for="Admin" style = "text-align: center">Administrator:</label><br />' +
			'yes:<input type="radio" name="Admin" id="Admin" value=' + true + ' checked/>' +
			' no:<input type="radio" name="Admin" id="Admin" value=' + false + ' />' +
			'<br />';
		}
		else{
		    responseHTML +='<label for="Admin" style = "text-align: center">Administrator:</label><br />' +
                        'yes:<input type="radio" name="Admin" id="Admin" value=' + true + ' />' +
                        ' no:<input type="radio" name="Admin" id="Admin" value=' + false + ' checked/>' +
                        '<br />';
		}
	    }
	    else{
		responseHTML += '<input type="hidden" name="Admin" id="Admin" value=' + Employee[0].Admin + ' />';
	    }
	    responseHTML += '<input type="hidden" name="EmployeeID" id="EmployeeID" value="' + Employee[0].EmployeeID + '" />' +
		'<input type="submit" />' + '</form>' + htmlFooter;
	    res.send(responseHTML);
	}
	
    });
});

app.get('/employee/update', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var UpdateQry = "UPDATE Employee SET First_Name='" + req.query.First_Name +"', Last_Name='" + req.query.Last_Name + "', Admin=" + req.query.Admin + " WHERE EmployeeID=" + req.query.EmployeeID;
    console.log(UpdateQry);
    connection.query( UpdateQry, function(err, Update){
	if(err){
	    console.log(err);
	    res.send("poop");
	}
	else{
	    if(req.query.EmployeeID==loginID || !AdminPriv)
		res.redirect("/employee/profile");
	    else{
		res.redirect("/employee");
	    }
	}
    });
});


app.get('/employee/profile', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var ProfileQry = "SELECT * FROM Employee WHERE EmployeeID=" + loginID;
    var responseHTML = loggedinHeader;
    connection.query(ProfileQry, function(err, ProfileRS){
	if(err){
	    console.log(err);
	    res.send("Darn");
	}
	else{
	    responseHTML+=
	    '<h1>' + ProfileRS[0].First_Name + ' ' + ProfileRS[0].Last_Name + '\'s Profile</h1>' +
		'<table border="1" align="center">' +
		'<tr><th>First Name</th><td>' + ProfileRS[0].First_Name + '</td></tr>' +
		'<tr><th>Last Name</th><td>' + ProfileRS[0].Last_Name + '</td></tr>' + 
		'<tr><th>Employee Number</th><td>' + ProfileRS[0].EmployeeID + '</td></tr>' +
		'<tr><td></td><td><a href="/employee/edit/?EmployeeID=' + loginID + '">Edit Profile</a></td></tr></table>' + htmlFooter;
	}
	res.send(responseHTML);
    });
});

app.get('/store/',  function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }

    var responseHTML = '<html><head><title>SCOREMORE!</title></head><body style=" text-align: center; line-height: 200px; vertical-align: center; font-family=arial">' +
	'<form action="/store/valid/" method="GET" style="font-family: arial">' +
        '<label for="Store_Number">Store Number: </label>'; 
    var storeQry= "SELECT * FROM Store";
    console.log(storeQry);
    connection.query(storeQry, function(err, store){
	if(err){
	    console.log(err);
	    res.send("poop");
	}
	else{
	    responseHTML +=
	    '<select id="Store_Number" name="Store_Number">';
	    for(var i =0; i<store.length; i++){
		responseHTML+= '<option value=' + store[i].Store_Number + '>' + store[i].Address + '</option>';
	    }
	    responseHTML +='</select><input type="submit" />' + '</form>' + 
		'<a href="/">Back</a>' + htmlFooter;
	    res.send(responseHTML);
	}
    });
});

app.get("/store/valid", function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var storeQry = 'SELECT * FROM Store';
    connection.query(storeQry, function(err, storeinfo){
	if(err){
	    console.log(err);
	    res.send("An error has ocurred");
	}
	else{
	    for (var i =0; i<storeinfo.length; i++){
		if(storeinfo[i].Store_Number == req.query.Store_Number){
		    StoreID=req.query.Store_Number;
		    if (order_num!=null){
			var updateQry = "UPDATE Scoremore SET Store_Number=" + StoreID + ' WHERE OrderID = ' + order_num;
			console.log(updateQry);
			connection.query(updateQry, function(err, update){
			    if(err){
				console.log(err);
				res.send("Oh poop");
			    }
			    else{
				res.redirect('/order/');
				return;
			    }
			});
		    }
		    
		    loggedinHeader = '<html><head><title>SCOREMORE!</title></head>' +
			'<h3 align="left">Store:' + StoreID + '|<a href="/store/">change store<a/></h3>' +
			'<h3 align="center" font-family="arial" align="center">|<a href="/order/">Home</a>|<a href="/employee/profile/">Profile</a>|<a href="/employee">Employees</a>|<a href="/order/existing/">Cart</a>|<a href="/order/all/">Orders</a>|<a href="/store/info/">Stores</a>|<a href="/logout" style="text-align: right">Logout</a>|</h3><body style="text-align: center; font-family: arial">'
		    
		    if(!order_num)
			res.redirect('/order/create/');
		    return;
		}
	    }
	    res.redirect('/store/invalid');
	    return;
	    
	}
    });
});

app.get('/store/info/', function(req, res){
    if(!AdminPriv){
	res.redirect("/restricted/")
	return;
    }
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var responseHTML =loggedinHeader;
    var storeinfo = "SELECT *,SUM(p.Price) as Total, SUM(p.Price)/COUNT(s.OrderID)as Average FROM Store as st " +
	"LEFT JOIN Scoremore as s on st.Store_Number=s.Store_Number " +
	"LEFT JOIN Cart_Item as c on c.OrderID = s.OrderID " +
	"LEFT JOIN Product as p on p.UPC = c.UPC " +
	"WHERE s.Date_Ordered is not null " +
	"GROUP BY st.Store_Number";
    console.log(storeinfo);
    connection.query(storeinfo, function(err, storeinfo){
	if(err){
	    console.log(err);
	    res.send("oops");
	}
	else{
	    responseHTML += '<table border="1" align="center"><tr>' +
		'<th>Store Number</th>' +
		'<th>Address</th>' +
		'<th>Average Sales</th>' +
		'<th>Total Sales</th>' +
		'<th><!-- Edit --></th>' +
		'<th><!-- Delete --></th>';
	    for (var i=0; i<storeinfo.length; i++){
		responseHTML += '<tr>' + 
		    '<td>' + storeinfo[i].Store_Number + '</td>' +
		    '<td>' + storeinfo[i].Address + '</td>' +
		    '<td>$' + storeinfo[i].Average +'</td>' +
		    '<td>$' + storeinfo[i].Total +  '</td>' +
		    '<td><a href="/store/edit?Store_Number=' + storeinfo[i].Store_Number + '">Edit</a></td>' +
		    '<td><a href="/store/delete?Store_Number=' + storeinfo[i].Store_Number + '">Delete</a></td>';
	    }
	    responseHTML += '</table>'  + '<a href="/store/add" >Add a Store</a>' + htmlFooter;
	    res.send(responseHTML);
	}
    });
    
});

app.get("/store/edit", function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var storeinfo= "SELECT * FROM Store WHERE Store_Number=" + req.query.Store_Number;
    console.log(storeinfo);
    connection.query(storeinfo, function(err, storeinfo){
	if(err){
	    console.log(err);
	    res.send("An error has occurred");
	}
	else{
	    var responseHTML = loggedinHeader + '<h1>Edit Store</h1>';
	    
	    responseHTML += '<form action="/store/update" method="GET">' +
		'<input type="hidden" name="Store_Number" id="Store_Number" value="' + storeinfo[0].Store_Number + '" />' +
		'<label for="Address">Address:</label><br />' + 
		'<textarea name="Address" id="Address">' + storeinfo[0].Address + '</textarea><br />' +
		'<input type="submit" /></form>' + htmlFooter;
	    res.send(responseHTML);
	}
    });
});

app.get("/store/add", function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var responseHTML = loggedinHeader;
    responseHTML += '<h1>Add a Store</h1>' +
    '<form action="/store/insert" method="GET">' +
	'<label for="Address">Address:</label><br />' +
	'<textarea name="Address" id="Address" /></textarea>' +
	'<input type="submit" /></form>' + htmlFooter;
    res.send(responseHTML);
});

app.get('/store/insert', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var newstore = 'INSERT INTO Store (Address) VALUES ("' + req.query.Address + '")';
    connection.query(newstore, function(err, store){
	if(err){
	    console.log(err);
	    res.send("poop");
	}
	else{
	    res.redirect("/store/info/");
	}
    });
});

app.get("/store/update", function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var storeupdate = 'UPDATE Store SET Address="' + req.query.Address + '" WHERE Store_Number=' + req.query.Store_Number;
    console.log(storeupdate);
    connection.query(storeupdate, function(err, storeupdate){
	if(err){
	    console.log(err);
	    res.send("poop");
	}
	else{
	    res.redirect("/store/info/");
	    }
    });
});

app.get("/store/delete", function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var storedelete = 'DELETE FROM Store WHERE Store_Number=' + req.query.Store_Number;
    connection.query(storedelete, function(err, deletestore){
	if(err){
	    console.log(err);
	    res.send("Delete");
	}
	else{
	    res.redirect("/store/info/");
	}
    });
});

app.get('/store/invalid', function(req, res){
    if(!loggedinbool){
        res.redirect("/");
        return;
    }
    else{
	
	var responseHTML = '<html><head><title>SCOREMORE!</title></head><body style=" text-align: center; line-height: 200px; vertical-align: center; font-family=arial">' +
            '<form action="/store/valid" method="GET" style="font-family: arial">';
	var storeQry= "SELECT * FROM Store";
	console.log(storeQry);
	connection.query(storeQry, function(err, store){
            if(err){
		console.log(err);
		res.send("poop");
            }
            else{
		responseHTML +=
		'<select id="Store_Number" name="Store_Number">';
		for(var i =0; i<store.length; i++){
                    responseHTML+= '<option value="' + store[i].Store_Number + '">' + store[i].Store_Number + '</option>';
		}
		
		
		responseHTML+='</select><input type="submit" />' + '</form>' + '<font color="red">Invalid Store Number!</font><br /' + '<a href="/">Back</a>' + htmlFooter;
		res.send(responseHTML);
	    }
	});
    }
});



app.get('/order/', function(req, res){
    if(!loggedinbool){
        res.redirect("/");
        return;
    }

    var responseHTML = loggedinHeader;
    responseHTML +='<h1>Product List</h1><table border=1; align="center">';
    var ProductQry = "SELECT * FROM Product";
    console.log(ProductQry);
    connection.query(ProductQry, function(err, ProductRS){
	if (err){
	    console.log(err);
	    res.send("Darn");
	}
	else{
	    console.log(StoreID);
	    responseHTML +=
	    '<tr>' + '<th><!--Link --></th>' +
		'<th>Make</th>' +
		'<th>Product Name</th>' +
		'<th>Model Number</th>' +
		'</tr>';
	    for (var i=0; i < ProductRS.length; i++){
		responseHTML += '<tr>'+
		  '<td><a href="/order/product/?UPC=' + ProductRS[i].UPC + '">Order</a></td>' +
		    '<td>' + ProductRS[i].Brand + '</td>' +
		    '<td>' + ProductRS[i].Product_Name + '</td>' +
		    '<td>' + ProductRS[i].VSN + '</td></tr>';
	    }
	    responseHTML += '</table>';
	    responseHTML += '<a href="/order/product/add" >Add Product</a>';
	    res.send(responseHTML);
	}
    });
});		     

app.get('/order/all/', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    if(!AdminPriv){
	res.redirect("/restricted");
	return;
    }
    var responseHTML = loggedinHeader + '<h1>All Orders</h1>';
    var orderQry = "SELECT *, SUM(p.Price) as Total FROM Scoremore as s RIGHT JOIN Cart_Item as c on s.OrderID=c.OrderID LEFT JOIN Product as p on p.UPC = c.UPC LEFT JOIN Employee as e on e.EmployeeID=s.EmployeeID WHERE s.Date_Ordered is not null GROUP BY s.OrderID";
    console.log(orderQry);
    connection.query(orderQry, function(err, order){
	if(err){
	    console.log(err);
	    res.send("Pooper");
	}
	else{
	    responseHTML += '<table border="1" align="center">';
	     responseHTML += '<tr><th>Order Number</th>' +
                    '<th>Employee</th>' +
                    '<th>Date Ordered</th>' +
		'<th>Store</th>' +
                    '<th>Total</th></tr>';

	    for(var i = 0; i < order.length; i++){
		responseHTML += '<tr><td>' + order[i].OrderID + '</td>' +
		    '<td>' + order[i].First_Name + ' ' + order[i].Last_Name + '</td>' +
		    '<td>' + order[i].Date_Ordered + '</td>' +
		    '<td>' + order[i].Store_Number + '</td>' +
		    '<td>$' + order[i].Total + '</td>' +
		    '</tr>'
	    }
	    res.send(responseHTML + htmlFooter);
	}//else
    });
    
});
       

app.get('/order/existing', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var responseHTML = loggedinHeader;
    var orderQry = "SELECT *, SUM(IFNULL(p.Price, 0)) as Total FROM Cart_Item as c JOIN Product as p ON p.UPC = c.UPC WHERE c.OrderID =" + order_num +"  GROUP BY c.OrderID";
    console.log(orderQry);
    connection.query(orderQry, function(err, order){
	if(err){
	    console.log(err);
	    res.send("Poopers");
	}
	else{
	    responseHTML += '<h1>Order: ' + order_num + '</h1>' +
		'<table border=1 align="center">' + '<tr>' +
		'<th><!-- Remove --></th>' +
		'<th>UPC</th>' + 
		'<th>Brand</th>' +
		'<th>Product Name</th>' +
		'<th>Price</th></tr>';
	    var orderinfoqry = "SELECT * FROM Cart_Item as c LEFT JOIN Product as p ON p.UPC=c.UPC WHERE OrderID =" + order_num;
	    console.log(orderinfoqry);
	    connection.query(orderinfoqry, function(err, orderinfo){
		if(err){
		    console.log(err);
		    res.send("Pooper 2");
		}
		else{
			for (var i =0; i < orderinfo.length; i++){
			    responseHTML += '<tr>' +
				'<td><a href="/order/cart/remove?ItemID=' + orderinfo[i].ItemID + '">Remove</a>' +
				'<td>' + orderinfo[i].UPC + '</td>' +
				'<td>' + orderinfo[i].Brand +  '</td>' +
				'<td>' + orderinfo[i].Product_Name + '</td>' +
				'<td>$' + orderinfo[i].Price + '</td></tr>';
			}
		    if(order.length>0){
			responseHTML += '<tr>' +
			    '<td></td><td></td><td></td><td>Total</td><td>$' + order[0].Total + '</td></tr></table>' + 
			    '<form action="/order/submit/" method="GET">' +
			    '<input type="submit" value="Place Order" /></form>' + htmlFooter;
			res.send(responseHTML);
		    }
		    else{
			responseHTML += '</table>' + htmlFooter;
			res.send(responseHTML);
		    }
		}
	    });
	}
    });
});
 
app.get('/order/submit/', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var place_order = 'UPDATE Scoremore SET Date_Ordered= CURRENT_TIMESTAMP WHERE OrderID=' + order_num;
    console.log(place_order);
    connection.query(place_order, function(err, scoremore){
	if(err){
	    console.log(err);
	    res.send("Unable to submit order");
	}
	else{
	    orderedbool = true;
	    res.redirect('/order/placed');
	}
    });
});



app.get('/order/placed', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var responseHTML = htmlHeader;
    responseHTML+= '<h1 style="text-align:center">Order Submitted</h1>' + '<p style=" text-align: center">Thank you for ordering from our website!\n What would you like to do next? <br />' +
	'<form action="/order/create/" style=" text-align: center">' + '<input type="submit" value="Place New Order" /></form>' +
	'<form action="/logout" style=" text-align: center">' + '<input type="submit" value="Logout" /></form></p>' + htmlFooter;
    orderedbool=false;
    order_num=null;
    res.send(responseHTML);
});




    
app.get('/order/product/', function(req, res){
    if(!loggedinbool){
        res.redirect("/");
        return;
    }
    
    var ProductQry= 'SELECT * FROM Product WHERE UPC= "' + req.query.UPC + '"';
    var responseHTML=loggedinHeader;
    console.log(ProductQry);

    connection.query(ProductQry, function(err, ProductInfo){
	if (err){
	    console.log(err);
	    res.send("An error occurred");
	}
	else{
	    responseHTML+= "<h1>" + ProductInfo[0].Product_Name + "</h1>" + 
		'<table border="1" align="center">' + 
		'<tr><th>Name</th><td>' + ProductInfo[0].Brand + ' ' +ProductInfo[0].Product_Name + '</td></tr>' +
		'<tr><th>Model</th><td>' + ProductInfo[0].VSN + '</td></tr>' +
		'<tr><th>Price</th><td>$' + ProductInfo[0].Price + '</td></tr>' +
		'<tr><th>UPC</th><td>' + ProductInfo[0].UPC + '</td></tr>' +
		'<tr><td></td><td><a href="/order/product/edit/?UPC=' + ProductInfo[0].UPC +'">Edit</a></td></tr></table>' +
		'<form action="/order/cart/add" method="GET">' +
		'<input type="hidden" name="UPC" id="UPC" value="' + ProductInfo[0].UPC + '" />' +
		'<input type="submit" value="Purchase"/></form>';
	    
	    responseHTML+= htmlFooter;
	    }
	res.send(responseHTML);
    });
});


app.get('/order/product/add', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var responseHTML = loggedinHeader;
    responseHTML += '<h1>Add a Product</h1>' + '<form action="/order/product/insert" method="GET">' +
	'<label for="Product_Name">Product Name:</label><input type="text" name="Product_Name" id="Product_Name"><br />' +
	'<label for="Brand">Brand:</label><input type="text" name="Brand" id="Brand"><br />' + 
	'<label for="VSN">Model:</label><input type="text" name="VSN" id="VSN" /><br />' +
	'<label for="Price">Price:</label><input type="number min="0.01" step="0.01" max="2500" name="Price" id="Price" /><br />' +
	'<label for="UPC">UPC:</label><input type="text" name="UPC" id="UPC" /><br />' +
	'<input type="submit" /></form>' + htmlFooter;
    res.send(responseHTML);
});

app.get('/order/product/insert', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var prodins = 'INSERT INTO Product VALUES ("' +
	req.query.Brand + '", "' +
	req.query.Product_Name + '", ' +
	req.query.Price + ', "' +
	req.query.VSN + '", "' +
	req.query.UPC + '")';
    connection.query(prodins, function(err, ins){
	if(err){
	    consol.log(err);
	    res.send("super pooper");
	    }
	else{
	    res.redirect('/order/existing');
	}
    });
});

app.get('/order/product/edit', function(req, res){
    if (!loggedinbool){
	res.redirect("/");
	return;
    }
    var product = 'SELECT * FROM Product WHERE UPC="' + req.query.UPC +'"';
    var responseHTML = loggedinHeader;
    connection.query(product, function(err, product){
	if(err){
	    console.log(err);
	    res.send("pooper");
	}
	else{
	    responseHTML += '<h1>Edit ' + product[0].Product_Name + '</h1>';
	    responseHTML += '<form action="/order/product/update" method="GET">' +
		'<label for="Product_Name">Product Name:</label><input type="text" name="Product_Name" id="Product_Name" value="' + 
		product[0].Product_Name + '"/><br />' +
		'<label for="Brand">Brand: </label><input type="text" name="Brand" id="Brand" value="' + 
		product[0].Brand + '" /><br />' +
		'<label for="VSN">Model: </label><input type="text" name="VSN" id="VSN" value="' + 
		product[0].VSN + '" /><br />' +
		'<label for="Price">Price: $</label><input type="number" min="0.01" step="0.01" max="2500" name="Price" id="Price" value="' + 
		product[0].Price + '"/><br />' +
		'<input type="hidden" name="UPC" id="UPC" value="' + product[0].UPC + '" />' +
		'<input type="submit" /></form>' + htmlFooter;
	    res.send(responseHTML);
	}
    });
});

app.get('/order/product/update', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var updateProd = 'UPDATE Product SET Product_Name="' +
	req.query.Product_Name + '", Brand="' +
	req.query.Brand + '", VSN="' +
	req.query.VSN +'", Price=' + 
	req.query.Price + ' WHERE UPC=' +
	req.query.UPC;
    console.log(updateProd);
    connection.query(updateProd, function(err, prod){
	if(err){
	    console.log(err);
	    res.send("pooper scooepr");
	}
	else{
	    res.redirect("/order/product/?UPC=" + req.query.UPC);
	}
    });
});
	

app.get('/order/cart/add', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var AddtoCart = "INSERT INTO Cart_Item (OrderID, UPC) VALUES (" + order_num + ', "' + req.query.UPC + '")';
    console.log(AddtoCart);

    connection.query(AddtoCart, function(err, cart){
	if(err){
	    console.log(err);
	}
	else{
	    res.redirect('/order/');
	}
    });
});

app.get('/order/cart/remove', function(req, res){
    if(!loggedinbool){
	res.redirect("/");
	return;
    }
    var itemremove = 'DELETE FROM Cart_Item WHERE ItemID=' + req.query.ItemID;
    console.log(itemremove);
    connection.query(itemremove, function(err, remove){
	if(err){
	    console.log(err);
	    res.send("Could not remove");
	}
	else{
	    res.redirect('/order/existing');
	}
    });

});


app.get('/order/create/', function(req, res){
    var CreateOrder = "INSERT INTO Scoremore (Store_Number, EmployeeID) VALUES (" + '"' + StoreID +'", ' + loginID + ')';
    console.log(CreateOrder);
    connection.query(CreateOrder, function(err, Order){
	if(err){
	    console.log(err);
	    res.send('An error has occured');
	    return;
	}
	else{
	    var Orderinfo = 'SELECT * FROM Scoremore WHERE Store_Number = "' + StoreID + '" AND EmployeeID = ' + loginID + ' AND Date_Ordered is null';
	    console.log(Orderinfo);
	    connection.query(Orderinfo, function(err, Orderinfo){
		if(err){
		    console.log(err);
		    res.send("oops");
		    return;
		}
		else{
		    order_num = Orderinfo[0].OrderID;
		    console.log(order_num);
		}
	    });
	    res.redirect('/order/');
	    }
    });
});

app.listen(8025);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
