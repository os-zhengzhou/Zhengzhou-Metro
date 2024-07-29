const line = require('./generate_line_json');
const station = require('./generate_station_json');
const llm = require('./generate_llm_map_md');

line.generate()
station.generate()
llm.generate()