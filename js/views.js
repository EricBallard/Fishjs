export function getViews() {
    query('getViews', 'local_count');
    query('getVisitors', 'total_count');
}

function query(path, id) {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const response = this.responseText.replace(/(\r\n|\n|\r)/gm, '');;
            document.getElementById(id).innerText = response;
        }
    };
    xmlhttp.open('GET', '/php/' + path + '.php', true);
    xmlhttp.send();
}