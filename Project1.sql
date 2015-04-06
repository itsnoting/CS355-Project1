use kting;

DROP TABLE IF EXISTS Employee;
DROP TABLE IF EXISTS Product;
DROP TABLE IF EXISTS Store;
DROP TABLE IF EXISTS Scoremore;
DROP TABLE IF EXISTS Cart_Item;

CREATE TABLE Employee(
	EmployeeID INT PRIMARY KEY AUTO_INCREMENT,
	First_Name VARCHAR(10),
	Last_Name VARCHAR(20),
	Admin bool
    );
    


CREATE TABLE Store (
	Store_Number INT AUTO_INCREMENT,
	Address varchar(100)
    );
    
CREATE TABLE Product (
	Brand VARCHAR(20),
	Product_Name VARCHAR(50),
    Price decimal(15,2),
	VSN varchar(12),
	UPC varchar(12) PRIMARY KEY
    );

CREATE TABLE Scoremore(
	OrderID INT PRIMARY KEY AUTO_INCREMENT,
	Date_Ordered DATETIME,
    Store_Number INT,
    EmployeeID INT,
    
    FOREIGN KEY (Store_Number) REFERENCES Store(Store_Number) ON DELETE CASCADE,
	FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID) ON DELETE CASCADE
    );

CREATE TABLE Cart_Item(
	ItemID INT PRIMARY KEY AUTO_INCREMENT,
	OrderID INT,
    UPC VARCHAR(12),
    
    FOREIGN KEY (OrderID) REFERENCES Scoremore(OrderID) ON DELETE CASCADE,
	FOREIGN KEY (UPC) REFERENCES Product(UPC) ON DELETE CASCADE
    );
    
INSERT INTO Store (Address) VALUES ("26591 Carl Boyer Drive Santa Clarita, CA, 91350");
INSERT INTO Store (Address) VALUES ("401 Kenilworth Way Petaluma, CA 94954");
INSERT INTO Store (Address) VALUES ("1975 Cleveland Avenue Santa Rosa, CA, 95401");

INSERT INTO Employee (First_Name, Last_Name, Admin) VALUES ("Kevin", "Ting", true);
INSERT INTO Employee (First_Name, Last_Name, Admin) VALUES ("Michael", "Haderman", true);
INSERT INTO Employee (First_Name, Last_Name, Admin) VALUES ("Mackenzie", "Larson", false);
INSERT INTO Employee (First_Name, Last_Name, Admin) VALUES ("Bria", "Gabor", false);
INSERT INTO Employee (First_Name, Last_Name, Admin) VALUES ("Mahesh", "Gautam", false);

INSERT INTO Product VALUES ("Nike",	"Elite Basketball",	49.99,	"104984-001", "800943889900");
INSERT INTO Product VALUES ('Cutters', 'X-40 C-TACK Revolution', 44.99, 'ISO-9002', '844018021066');
INSERT INTO Product VALUES ('Nike', 'Mercurial Vapor X', 200.00, '648553-016', '887231218981');
INSERT INTO Product VALUES ('Adidas', 'Predator Instinct', 250.00, 'M17642', '8873814215');
INSERT INTO Product VALUES ('Under Armour', 'Highlight MC', 119.99, '1246123-011', '888284331566');






