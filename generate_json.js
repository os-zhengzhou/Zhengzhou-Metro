const line = require('./generate_line_json');
const station = require('./generate_station_json');
const readme = require('./generate_readme');
const llm = require('./generate_llm');


line.generate()
station.generate()
readme.generate()
llm.generate()