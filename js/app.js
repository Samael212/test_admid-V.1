let records = [];

let currentUser = {
    loggedIn: false,
    admin: false
};


const $ = id =>
    document.getElementById(id);


// ==========================
// API
// ==========================

async function api(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            {
                headers: {
                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})
                },

                ...options
            }
        );


    const data =
        await response
            .json()
            .catch(
                () => ({})
            );


    if (!response.ok) {

        throw new Error(
            data.message ||
            "เกิดข้อผิดพลาด"
        );

    }


    return data;
}


// ==========================
// DISCORD USER
// ==========================

async function loadUser() {

    currentUser =
        await api(
            "/api/me"
        );


    $("discordLogin")
        .classList
        .toggle(
            "hidden",
            currentUser.loggedIn
        );


    $("userBox")
        .classList
        .toggle(
            "hidden",
            !currentUser.loggedIn
        );


    if (currentUser.loggedIn) {

        const user =
            currentUser.user;


        $("userName")
            .textContent =
            user.global_name ||
            user.username;


        if (user.avatar) {

            $("userAvatar").src =
                `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

        } else {

            $("userAvatar").src =
                "https://cdn.discordapp.com/embed/avatars/0.png";

        }


        $("adminBadge")
            .classList
            .toggle(
                "hidden",
                !currentUser.admin
            );

    }


    $("clearHistoryBtn")
        .classList
        .toggle(
            "hidden",
            !currentUser.admin
        );


    $("adminHead")
        .classList
        .toggle(
            "hidden",
            !currentUser.admin
        );
}


// ==========================
// RECORDS
// ==========================

async function loadRecords() {

    records =
        await api(
            "/api/records"
        );


    renderTable();

    updateStats();
}


// ==========================
// CHECK IN
// ==========================

async function checkIn() {

    const name =
        $("nameInput")
            .value
            .trim();


    if (!name) {

        return notify(
            "⚠️ กรุณากรอกชื่อ"
        );

    }


    try {

        await api(
            "/api/check-in",
            {
                method:
                    "POST",

                body:
                    JSON.stringify({
                        name
                    })
            }
        );


        $("nameInput").value =
            "";


        notify(
            `🟢 ${name} เข้าเวรแล้ว`
        );


        await loadRecords();

    } catch (error) {

        notify(
            "⚠️ " +
            error.message
        );

    }
}


// ==========================
// CHECK OUT
// ==========================

async function checkOut() {

    const name =
        $("nameInput")
            .value
            .trim();


    if (!name) {

        return notify(
            "⚠️ กรุณากรอกชื่อ"
        );

    }


    try {

        await api(
            "/api/check-out",
            {
                method:
                    "POST",

                body:
                    JSON.stringify({
                        name
                    })
            }
        );


        $("nameInput").value =
            "";


        notify(
            `🔴 ${name} ออกเวรแล้ว`
        );


        await loadRecords();

    } catch (error) {

        notify(
            "⚠️ " +
            error.message
        );

    }
}


// ==========================
// TABLE
// ==========================

function renderTable() {

    const search =
        $("searchInput")
            .value
            .trim()
            .toLowerCase();


    const filtered =
        records.filter(
            r =>
                r.name
                    .toLowerCase()
                    .includes(search)
        );


    if (!filtered.length) {

        $("dutyTable").innerHTML = `

            <tr>

                <td
                    colspan="${
                        currentUser.admin
                            ? 7
                            : 6
                    }"

                    style="
                        text-align:center;
                        color:#777;
                        padding:35px;
                    "
                >

                    ไม่พบข้อมูล

                </td>

            </tr>

        `;

        return;
    }


    $("dutyTable").innerHTML =

        filtered.map(
            (record, index) => `

            <tr>

                <td>
                    ${index + 1}
                </td>

                <td>
                    <strong>
                        ${escapeHTML(
                            record.name
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        record.date
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        record.checkIn
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        record.checkOut
                    )}
                </td>

                <td>

                    ${
                        record.status ===
                        "active"

                        ?

                        `
                        <span
                            class="status active"
                        >
                            🟢 กำลังเข้าเวร
                        </span>
                        `

                        :

                        `
                        <span
                            class="status finished"
                        >
                            ✓ ออกเวรแล้ว
                        </span>
                        `
                    }

                </td>


                ${
                    currentUser.admin

                    ?

                    `
                    <td>

                        <button
                            class="delete-btn"
                            onclick="
                                deleteRecord(
                                    '${record.id}'
                                )
                            "
                        >
                            🗑 ลบ
                        </button>

                    </td>
                    `

                    :

                    ""
                }

            </tr>

        `
        ).join("");
}


// ==========================
// DELETE ONE
// ==========================

async function deleteRecord(id) {

    if (!currentUser.admin) {

        return notify(
            "⛔ ไม่มีสิทธิ์ ADMIN"
        );

    }


    if (
        !confirm(
            "ต้องการลบรายการนี้หรือไม่?"
        )
    ) {
        return;
    }


    try {

        await api(
            `/api/records/${encodeURIComponent(id)}`,
            {
                method:
                    "DELETE"
            }
        );


        notify(
            "🗑️ ลบรายการเรียบร้อยแล้ว"
        );


        await loadRecords();

    } catch (error) {

        notify(
            "⚠️ " +
            error.message
        );

    }
}


// ==========================
// OPEN CLEAR MODAL
// ==========================

function clearHistory() {

    if (!currentUser.admin) {

        return notify(
            "⛔ ไม่มีสิทธิ์ ADMIN"
        );

    }


    const modal =
        $("clearModal");


    const input =
        $("clearPassword");


    input.value =
        "";


    input.type =
        "password";


    modal
        .classList
        .remove(
            "hidden"
        );


    setTimeout(
        () => input.focus(),
        100
    );
}


// ==========================
// CLOSE MODAL
// ==========================

function closeClearModal() {

    $("clearModal")
        .classList
        .add(
            "hidden"
        );


    $("clearPassword")
        .value =
        "";
}


// ==========================
// SHOW PASSWORD
// ==========================

function togglePassword() {

    const input =
        $("clearPassword");


    input.type =
        input.type ===
        "password"

            ?

            "text"

            :

            "password";
}


// ==========================
// CONFIRM CLEAR
// ==========================

async function confirmClearHistory() {

    if (!currentUser.admin) {

        return notify(
            "⛔ ไม่มีสิทธิ์ ADMIN"
        );

    }


    const password =
        $("clearPassword")
            .value
            .trim();


    if (!password) {

        return notify(
            "⚠️ กรุณาใส่รหัส"
        );

    }


    try {

        await api(
            "/api/records",
            {
                method:
                    "DELETE",

                body:
                    JSON.stringify({
                        password
                    })
            }
        );


        closeClearModal();


        notify(
            "🗑️ ล้างประวัติเรียบร้อยแล้ว"
        );


        await loadRecords();

    } catch (error) {

        notify(
            "❌ " +
            error.message
        );

    }
}


// ==========================
// LOGOUT
// ==========================

async function logout() {

    try {

        await api(
            "/auth/logout",
            {
                method:
                    "POST"
            }
        );


        location.reload();

    } catch (error) {

        notify(
            "⚠️ " +
            error.message
        );

    }
}


// ==========================
// STATS
// ==========================

function updateStats() {

    $("totalCount")
        .textContent =

        new Set(
            records.map(
                r => r.name
            )
        ).size;


    $("activeCount")
        .textContent =

        records.filter(
            r =>
                r.status ===
                "active"
        ).length;


    $("recordCount")
        .textContent =
        records.length;
}


// ==========================
// CLOCK
// ==========================

function updateClock() {

    $("currentTime")
        .textContent =

        new Date()
            .toLocaleTimeString(
                "th-TH"
            );
}


setInterval(
    updateClock,
    1000
);


updateClock();


// ==========================
// NOTIFICATION
// ==========================

function notify(message) {

    const element =
        $("notification");


    element.textContent =
        message;


    element
        .classList
        .add(
            "show"
        );


    clearTimeout(
        notify.timer
    );


    notify.timer =
        setTimeout(
            () => {

                element
                    .classList
                    .remove(
                        "show"
                    );

            },
            2500
        );
}


// ==========================
// ESC / ENTER MODAL
// ==========================

document.addEventListener(
    "keydown",
    event => {

        const modal =
            $("clearModal");


        if (
            modal.classList.contains(
                "hidden"
            )
        ) {
            return;
        }


        if (
            event.key ===
            "Escape"
        ) {
            closeClearModal();
        }


        if (
            event.key ===
            "Enter"
        ) {
            confirmClearHistory();
        }

    }
);


// ==========================
// SECURITY
// ==========================

function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


// ==========================
// START
// ==========================

(async function init() {

    try {

        await loadUser();

        await loadRecords();

    } catch (error) {

        notify(
            "⚠️ " +
            error.message
        );

    }

})();