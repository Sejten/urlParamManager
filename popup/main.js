//ctr+z
var history;
var sorted = null;
/**
 * Listen for clicks on the buttons
 */
function listen_for_clicks() {
	document.addEventListener("click", (e) => {
		if (e.target.classList.contains("set_url")) {
			set_url();
		}
	});
	// add callback for sort button
	window
	.top
	.document
	.getElementById("sort_icon")
	.addEventListener("click", (e) => {
		get_url(true);
	}); ;
}

/**
 * Listen for key press
 */
function listen_for_button_press() {
	document.addEventListener("keypress", (e) => {
		if (e.key == "Enter") {
			set_url();
		}
	});
}

/**
 * Get history
 */
function load_history() {
	let gettingItem = browser.storage.sync.get("history");
	gettingItem.then(onGetHistory, onError).then(get_url);
}

/**
 * Callback for retrieving history
 */
function onGetHistory(storage) {
	if (storage.history != null) {
		Object.keys(storage.history).forEach(function (key) {
			history[key] = storage.history[key];
		});
		if (history == null) {
			history = {};
		} else {
			Object.keys(history).forEach(function (key) {
			});
		}
		add_element_history(history["address"], "url_history", "base_url_container");
	}
}

/**
 * Error callback
 */
function onError(error) {
	console.debug(`Error: ${error}`);
}

/**
 * Add new value to history of params
 */
function update_history(key, value) {
	if (history != null) {
		if (history[key] == null) {
			history[key] = [];
		}
		if (!history[key].includes(value)) {
			history[key].push(value);
		}
		if (history[key].length > 3) {
			history[key].splice(0, 1);
		}
	}
}

/**
 * Save history
 */
function save_history() {
	if (history != null) {
		let contentToStore = {};
		contentToStore["history"] = {};
		Object.keys(history).forEach(function (key) {
			contentToStore["history"][key] = history[key];
		});

		browser.storage.sync.set(contentToStore);
	}
}

/**
 * Gets params from table and sets url
 */
function set_url() {
	var table = window.top.document.getElementById("param_table");
	var address = window.top.document.getElementById("base_url").value;
	update_history("address", address)
	if (table != null) {
		address = address + "?";
		// iterate starting 1 row ignore header
		for (var i = 1; table.children.length > i; i++) {
			var row = table.children[i];
			// find inputs
			for (var j = 1; row.children.length > j; j++) {
				if (row.children[j].firstChild.id.includes("param_input")) {
					if (row.children[j].firstChild.value != "") {
						var param = row.children[j].firstChild.value;
						var value = row.children[j + 1].firstChild.value;
						update_history(param, value);
						address = address + encodeURIComponent(param) + "=" + encodeURIComponent(value) + "&";
					}
				}
			}
		}
		address = address.substring(0, address.length - 1);
		save_history();
	}
	browser.tabs.update({
		url: address
	});
}

/**
 * Gets url and creates table with params
 */
function get_url(shouldBeSorted) {
	browser
	.tabs
	.query({
		currentWindow: true,
		active: true
	})
	.then((tabs) => {

		function create_header(table) {
			var table_header = document.createElement("div");
			table_header.classList.add("divTableHeading");
			var th;

			// drag button
			th = document.createElement("div");
			th.classList.add("divTableHeadBorderless");
			th.appendChild(document.createTextNode(" "));
			table_header.appendChild(th);

			th = document.createElement("div");
			th.classList.add("divTableHead");
			th.appendChild(document.createTextNode("Param"));
			table_header.appendChild(th);

			th = document.createElement("div");
			th.appendChild(document.createTextNode("Value"));
			th.classList.add("divTableHead");
			table_header.appendChild(th);

			// delete button
			th = document.createElement("div");
			th.classList.add("divTableHeadBorderless");
			th.appendChild(document.createTextNode(" "));
			table_header.appendChild(th);
			return table_header;
		}

		function sort(array) {
			return array.sort(function (a, b) {
				a = a.toLowerCase();
				b = b.toLowerCase();
				a.replace("=", "");
				b.replace("=", "");
				if (a < b)
					return -1;
				else if (a > b)
					return 1;
				return 0;
			});
		}

		// separate adress
		var address = decodeURIComponent(tabs[0].url);
		var main_address = address.split("?")[0];
		// set adress in input
		window.top.document.getElementById("base_url").value = main_address;
		// get top container
		var table_container = window.top.document.getElementById("param_table_container");
		//remove old table if exists
		if (window.top.document.getElementById("param_table") != null) {
			window.top.document.getElementById("param_table").remove();
		}
		// create new table
		var table = document.createElement("div");
		table.id = "param_table";
		table.classList.add("divTable");
		// header
		table.appendChild(create_header(table));
		// if there are parameters
		if (address.split("?").length > 1) {
			var address_split = address.split("?")
			address_split.shift();
			address_split = address_split.join().split("&");
			// hack
			if (address_split.length > 20) {
				table.style.marginRight = "10px";
			}
			if (shouldBeSorted) {
				if (sorted == null || sorted == 1) {
					address_split.sort();
                    sorted = 0;
				} else {
					address_split.sort().reverse();
                    sorted = 1;
				}
			}
			// rows
			// add row for each param
			for (var r = 0; r < address_split.length; r++) {
				var param = address_split[r].split("=")[0];
				var value = address_split[r].split("=")[1];
				var row = create_row(r + 1, table, param, value);
				table.appendChild(row);
			}
		}
		table_container.appendChild(table);
		add_empty_row_at_end();
	})
	.then(update_cell_history);
}

function create_row(row_number, table, param, value) {
	function dragstart_handler(ev) {
		ev.dataTransfer.setData("text/plain", ev.currentTarget.id);
	}

	function dragover_handler(ev) {
		ev.preventDefault();
		ev.dataTransfer.dropEffect = "move"
	}

	function drop_handler(ev) {
		ev.preventDefault();
		var source_id = ev.dataTransfer.getData("text/plain").replace("drag", "row"); ;
		var source_row = document.getElementById(source_id);
		var target_row = document.getElementById(ev.currentTarget.id.replace("drag", "row"));
		var tar1 = target_row.children[1].firstChild.value;
		var tar2 = target_row.children[2].firstChild.value;
		target_row.children[1].firstChild.value = source_row.children[1].firstChild.value;
		target_row.children[2].firstChild.value = source_row.children[2].firstChild.value;
		source_row.children[1].firstChild.value = tar1;
		source_row.children[2].firstChild.value = tar2;
	}

	function delete_row(ev) {
		document.getElementById(ev.rangeParent.parentNode.id).remove();
		add_empty_row_at_end(null);
	}

	var tr = document.createElement("div");
	var row_id = "row" + row_number;
	tr.id = row_id;
	tr.classList.add("divTableRow");
	// drag handle
	var td1 = document.createElement("div");
	td1.classList.add("divTableCellBorderless");
	var img = document.createElement("img");
	img.src = "move.png";
	img.alt = "Move";
	img.height = "16";
	img.width = "16";
	img.draggable = true;
	img.id = "drag" + row_number;
	img.addEventListener('dragstart', dragstart_handler);
	img.addEventListener('drop', drop_handler);
	img.addEventListener('dragover', dragover_handler);
	td1.appendChild(img);
	tr.appendChild(td1);

	// both inputs
	var td1 = document.createElement("div");
	td1.classList.add("divTableCell");
	var td2 = document.createElement("div");
	td2.classList.add("divTableCell");
	var input1 = document.createElement("input");
	input1.value = param;
	input1.id = "param_input" + row_number;
	// double click to select text
	input1.addEventListener('dblclick', function () {
		this.select()
	});
	input1.addEventListener("keypress", (e) => {
		if (e.key == "Enter") {
			set_url();
		}
	});
	input1.setAttribute("list", "param_input" + row_number + "_history");
	var input2 = document.createElement("input");
	input2.value = value;
	input2.id = "value_input" + row_number;
	// double click to select text
	input2.addEventListener('dblclick', function () {
		this.select()
	});
	input2.addEventListener("keypress", (e) => {
		if (e.key == "Enter") {
			set_url();
		}
	});
	input2.setAttribute("list", "value_input" + row_number + "_history");
	td1.appendChild(input1);
	td2.appendChild(input2);
	tr.appendChild(td1);
	tr.appendChild(td2);
	// delete button
	var td1 = document.createElement("div");
	td1.classList.add("divTableCellBorderless");
	var img = document.createElement("img");
	img.src = "delete.png";
	img.alt = "Delete";
	img.addEventListener('click', delete_row);
	img.height = "16";
	img.width = "16";
	img.id = "delete_button" + (row_number + 1);
	td1.appendChild(img);
	tr.appendChild(td1);

	return tr;
}

function add_empty_row_at_end(ev) {

	function is_empty_row_at_end() {
		var cells = window.top.document.getElementsByClassName("divTableCell");
		if (cells.length != 0) {
			var lastParamCell = cells[cells.length - 2];
			return cells[cells.length - 2].firstChild.value == "";
		} else {
			return false;
		}
	}

	function clear_event_handlers_on_input() {
		var inputs = window.top.document.getElementsByTagName("INPUT");
		for (var i = 0; inputs.length > i; i++) {
			inputs[i].removeEventListener("keypress", add_empty_row_at_end);
		}
	}

	function reset_all_images() {
		var imgs = window.top.document.getElementsByTagName("IMG");
		for (var i = 0; imgs.length > i; i++) {
			imgs[i].classList.remove("hidden");
			if (imgs[i].id.includes("delete_button")) {
				imgs[i].src = "delete.png";
			}
		}
	}

	function get_last_row_id() {
		var rows = window.top.document.getElementsByClassName("divTableCell");
		if (rows.length != 0) {
			var row = rows[rows.length - 1].parentNode.id;
			row = row.replace("row", "");
			return parseInt(row);
		} else {
			return 1;
		}
	}

	if (!is_empty_row_at_end()) {
		var table = window.top.document.getElementById("param_table");
		var row = create_row(get_last_row_id() + 1, table, "", "");
		table.appendChild(row);
		clear_event_handlers_on_input();
		reset_all_images();
		row.children[1].firstChild.addEventListener('keypress', add_empty_row_at_end);
		for (var j = 0; row.children.length > j; j++) {
			if (row.children[j].firstChild.id.includes("delete_button")) {
				row.children[j].firstChild.src = "add.png";
			}
			if (row.children[j].firstChild.id.includes("drag")) {
				row.children[j].firstChild.classList.add('hidden');
			}
		}
	}
}

function update_cell_history() {
	var cells = window.top.document.getElementsByClassName("divTableCell");
	if (cells.length != 0) {
		for (var i = 0; cells.length > i; i++) {
			if (cells[i].firstChild.id.includes("param")) {
				var row_id = cells[i].parentNode.id;
				row_number = row_id.replace("row", "");
				var his = history[cells[i].firstChild.value];
				if (his == null) {
					his = [];
				}
				if (his.length != 0) {
					add_element_history(his, "value_input" + row_number + "_history", row_id);
				}
			}
		}
	}
}

function add_element_history(history_list, id, parent_element_name) {
	if (history_list.length == 0) {
		return;
	}
	var his = window.top.document.getElementById(id);
	var parent_element = window.top.document.getElementById(parent_element_name);
	if (his != null) {
		his.remove();
	}
	var dl = document.createElement("datalist");
	dl.id = id;
	for (var i = 0; history_list.length > i; i++) {
		var option = document.createElement("option");
		option.value = history_list[i];
		dl.appendChild(option);
	}
	parent_element.appendChild(dl);
}

load_history();
listen_for_clicks();
listen_for_button_press();
