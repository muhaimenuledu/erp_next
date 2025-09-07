frappe.listview_settings['Test001'] = {
    onload: function(listview) {
        let page_length = 20;
        let start = 0;

        let category_gl_map = {}; // Cache Fixed Asset Account per category

        function load_assets(reset=false) {
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Asset",
                    fields: ["name", "asset_name", "asset_category"],
                    order_by: "creation desc",
                    limit_start: start,
                    limit_page_length: page_length
                },
                callback: function(r) {
                    if (reset) {
                        listview.page.wrapper.find('.result').html(asset_table_template());
                    }

                    if (r.message && r.message.length > 0) {

                        // Identify categories that we haven’t fetched yet
                        let categories_to_fetch = r.message
                            .map(d => d.asset_category)
                            .filter(c => c && !category_gl_map[c]);

                        if (categories_to_fetch.length > 0) {
                            // Fetch each category with frappe.client.get
                            categories_to_fetch.forEach(category_name => {
                                frappe.call({
                                    method: "frappe.client.get",
                                    args: { doctype: "Asset Category", name: category_name },
                                    async: false,
                                    callback: function(res) {
                                        let fa_account = "";
                                        if (res.message.accounts && res.message.accounts.length > 0) {
                                            fa_account = res.message.accounts[0].fixed_asset_account || "";
                                        }
                                        category_gl_map[category_name] = fa_account;
                                    }
                                });
                            });
                        }

                        // Build table rows
                        let rows = r.message.map(d => `
                            <tr>
                                <td>${d.name}</td>
                                <td>${d.asset_name || ""}</td>
                                <td>${d.asset_category || ""}</td>
                                <td>${d.asset_category ? (category_gl_map[d.asset_category] || "") : ""}</td>
                            </tr>
                        `).join("");

                        listview.page.wrapper.find('#asset_rows').append(rows);
                        listview.page.wrapper.find('#show_more_btn').show();
                    } else {
                        listview.page.wrapper.find('#show_more_btn').hide();
                        if (reset) {
                            listview.page.wrapper.find('#asset_rows').append(
                                `<tr><td colspan="4" class="text-center text-muted">No Assets Found</td></tr>`
                            );
                        }
                    }
                }
            });
        }

        function asset_table_template() {
            return `
                <div style="padding:10px;">
                    <h4>Asset Records (Read-only)</h4>
                    <table class="table table-bordered table-sm">
                        <thead>
                            <tr>
                                <th>Asset ID</th>
                                <th>Asset Name</th>
                                <th>Asset Category</th>
                                <th>Fixed Asset Account</th>
                            </tr>
                        </thead>
                        <tbody id="asset_rows"></tbody>
                    </table>
                    <div style="text-align:center; margin-top:10px;">
                        <button class="btn btn-sm btn-default" id="show_more_btn" style="display:none;">
                            Show More
                        </button>
                    </div>
                </div>
            `;
        }

        // Initial load
        load_assets(true);

        // Show more button
        listview.page.wrapper.on("click", "#show_more_btn", function() {
            start += page_length;
            load_assets(false);
        });
    }
};
