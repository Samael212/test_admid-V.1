let records = [];

let currentUser = {
    loggedIn: false,
    admin: false
};

const $ = id =>
    document.getElementById(id);

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
            .catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message ||
            "เกิดข้อผิดพลาด"
        );
    }

    return data;
}

async function loadUser() {
    currentUser =
        await api("/api/me");

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

        $("userName").textContent =
            user.global_name ||
            user.username;

        if (user.avatar) {
            $("userAvatar").src =
                `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
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

async function loadRecords() {
    records =
        await api(
            "/api/records"
        );

    renderTable();
    updateStats();
}

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

function renderTable() {
    const search =
        $("searchInput")
            .value
            .trim()
            .toLowerCase();

    const filtered =
        records.filter(
            record =>
                record.name
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
                    ${escapeHTML(
                        record.name
                    )}
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
                        <span class="status active">
                            🟢 กำลังเข้าเวร
                        </span>
                        `

                        :

                        `
                        <span class="status finished">
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
                            onclick="deleteRecord('${record.id}')"
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

async function deleteRecord(id) {
    if (!currentUser.admin) {
        return notify(
            "⛔ ไม่มีสิทธิ์ ADMIN"
        );
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
            "🗑️ ลบรายการแล้ว"
        );

        await loadRecords();

    } catch (error) {
        notify(
            "⚠️ " +
            error.message
        );
    }
}

function clearHistory() {
    if (!currentUser.admin) {
        return notify(
            "⛔ ไม่มีสิทธิ์ ADMIN"
        );
    }

    $("clearModal")
        .classList
        .remove(
            "hidden"
        );

    $("clearPassword")
        .value =
        "";
}

function closeClearModal() {
    $("clearModal")
        .classList
        .add(
            "hidden"
        );
}

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

async function confirmClearHistory() {
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

async function logout() {
    await api(
        "/auth/logout",
        {
            method:
                "POST"
        }
    );

    location.reload();
}

function updateStats() {
    $("totalCount").textContent =
        new Set(
            records.map(
                record =>
                    record.name
            )
        ).size;

    $("activeCount").textContent =
        records.filter(
            record =>
                record.status ===
                "active"
        ).length;

    $("recordCount").textContent =
        records.length;
}

function updateClock() {
    $("currentTime").textContent =
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

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

(async function init() {
    try {
        await loadUser();
        await loadRecords();
    } catch (error) {
        console.error(error);
    }
})();