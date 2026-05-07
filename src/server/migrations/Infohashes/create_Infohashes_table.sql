
CREATE TABLE Infohashes (
    infohash CHARACTER(40) PRIMARY KEY,
    updatedDt DATETIME NOT NULL,
    name VARCHAR NOT NULL,
    length INTEGER NOT NULL,
    source VARCHAR NOT NULL,
    occurrences INTEGER NOT NULL,
    filesCount INTEGER NULL,
    trackerData_json TEXT CHECK(json_valid(trackerData_json))
);
