(function($) {
    var $clickedItem = undefined;
    var default_error_message = 'This field has wrong value';

    var options = {
        id: 1,
        keyset: 'embedwidget',
        lang: 'en',
        headers: false,
        level: 0, // How many levels deep, 0 == no children
        // title_field: 'title', // it must be editing field too
        title_header_field: 'title',
        title_item_field: 'name',
        children_field: 'children',
        header_edit_fields: [
            ['title', 'text'], ],
        /*
         * array: name, type, object for select, regex validation, error message, text for label
         *   type: text, select, textarea, ckeditor, checkbox
         */
        item_edit_fields: [
            ['title', 'text', [], /^\S+$/, 'This field has wrong value'],
            ['category', 'select', {
                0: '- Select -'
            }],
            ['text', 'textarea'],
            ['content', 'ckeditor'], ],
        popup_width: 600, // must be a number
        popup_top: 100, // must be a number
        delete_message: 'Really delete this Group with Datasets?',
        popup_after_show: function($item) {}, // parameter: jQuery object or undefined
        popup_before_hide: function($item) {}, // parameter: jQuery object or undefined
        modify_data_after_load: function(data) {
            return data;
        },
        modify_data_before_save: function(data) {
            return data;
        },
        modify_data_before_publish: function(data) {
            return data;
        },
        editor_after_publish: function(self) {},
        editor_after_save: function(self) {},
        editor_after_load: function(self) {},
        editor_after_load_published: function(self) {},
        refreshData: undefined
    };

    var narrativeSettings = {
        stamp: "listeditor",
        editor: {
            tiny: true,
            toolbar_tellmaps: [{
                name: 'styles',
                items: ['Format', 'FontSize']
            }, {
                name: 'basicstyles',
                groups: ['basicstyles', 'cleanup'],
                items: ['Bold', 'Italic', 'Underline', 'Subscript', 'Superscript', 'RemoveFormat']
            }, {
                name: 'paragraph',
                groups: ['list', 'indent', 'blocks', 'align'],
                items: ['JustifyLeft', 'JustifyRight', 'JustifyCenter', 'JustifyBlock', 'BulletedList', 'NumberedList']
            }, {
                name: 'editing',
                groups: ['find', 'selection', 'undo'],
                items: ['PasteFromWord', 'Undo', 'Redo']
            }, {
                name: 'links',
                items: ['Link', 'Unlink']
            }, {
                name: 'source',
                items: ['Source']
            }, ],
            toolbar: "tellmaps",
            width: 750,
            height: 250,
            extraPlugins: 'widget,divarea',
            format_tags: 'p;h1;h2;h3;h4',
            tellmaps_plugin: {},
            contentsCss: ['../studio/js/plugins/ckeditor/contents.css', '../studio/js/plugins/ckeditor/tellmaps_styles.css', '../css/mwcharts/chart.css', '../css/mwcharts/editor.css'],
        },
        styles: [{
            name: "Caption (figure)",
            element: "p",
            attributes: {
                "class": "caption"
            }
        }, {
            name: "Credit (figure)",
            element: "p",
            attributes: {
                "class": "credit"
            }
        }]
    };

    $.listEditor = function(opt, $self) {

        /* JSON - ajax */
        this.getPublishedData = function() {
            var self = this;

            $.ajax({
                url: 'URL_HIDDEN_FOR_SECURITY_PURPOSES',
                data: {
                    cmd: 'getjson',
                    type: this.options.keyset,
                    id: this.options.id,
                    lang: this.options.lang,
                },
                type: 'POST',
                success: function(data, status) {
                    //            console.log(data, status); // TODO:
                    self.options.editor_after_load_published(self);
                },
                error: function(jqxhr, status, error) {
                    console.log(status + ': ' + error);
                },
            });
        };

        this.loadJson = function() {
            var self = this;
            self.spinner(true);

            $.ajax({
                url: 'URL_HIDDEN_FOR_SECURITY_PURPOSES',
                dataType: 'json',
                data: {
                    cmd: 'getjson',
                    type: this.options.keyset,
                    id: this.options.id,
                    lang: this.options.lang,
                },
                type: 'POST',
                success: function(data, status) {
                    //            console.log(data, status); // TODO:
                    self.json_data = (typeof self.options.modify_data_after_load === 'function') ? self.options.modify_data_after_load(data) : data;
                    self.initializeHtml();
                    self.spinner(false);
                    self.options.editor_after_load(self);
                },
                error: function(jqxhr, status, error) {
                    console.log(status + ': ' + error);
                },
            });
        };

        this.saveJson = function(data) {
            var self = this;

            $.ajax({
                url: 'URL_HIDDEN_FOR_SECURITY_PURPOSES',

                data: {
                    cmd: 'savejson',
                    type: this.options.keyset,
                    id: this.options.id,
                    lang: this.options.lang,
                    blob: JSON.stringify(data)
                },
                type: 'POST',
                success: function(data, status) {
                    //           console.log(data, status); // TODO:
                    self.showMessage('Data was saved.');
                    self.options.editor_after_save(self);
                },
                error: function(jqxhr, status, error) {
                    console.log(status + ': ' + error);
                },
            });
        };

        this.publishJson = function(data) {
            var self = this;

            $.ajax({
                url: 'URL_HIDDEN_FOR_SECURITY_PURPOSES',
                data: {
                    cmd: 'saveandpublishjson',
                    type: this.options.keyset,
                    id: this.options.id,
                    lang: this.options.lang,
                    blob: JSON.stringify(data)
                },
                type: 'POST',
                success: function(data, status) {
                    //           console.log(data, status); // TODO:
                    self.showMessage('Data was published.');
                    self.options.editor_after_publish(self);
                },
                error: function(jqxhr, status, error) {
                    console.log(status + ': ' + error);
                },
            });
        };

        this.showMessage = function(text, seconds) {
            if (typeof seconds === 'undefined') {
                seconds = 60;
            }

            if (typeof text === 'undefined') {
                text = '???';
            }

            $('.actionsEditor').find('.status').text(text);

            setTimeout(function() {
                $('.actionsEditor').find('.status').text('');
            }, (seconds * 1000));
        };

        /* */
        this.initializeHtml = function() {
            var self = this;

            var $html = self.renderData(this.json_data, 0);
            self.$self.find('.listEntries').html('');
            self.$self.find('.listEntries').append($html);
            self.initializeEvents();

            for (var i = 0; i <= self.options.level; i += 1) {
                self.$self.find('.listEntries .sortable-' + i).sortable({
                    placeholder: "ui-state-highlight",
                    connectWith: ".listEntries .sortable-" + i,
                    items: "> li",
                    handle: '> .title',
                    update: function() {
                        self.refreshData();
                    },
                });
                self.$self.find('.listEntries .sortable-' + i).disableSelection();
            }
        };

        this.refreshSortable = function() {
            var self = this;
            for (var i = 0; i <= self.options.level; i += 1) {
                $('.listEntries .sortable-' + i).sortable('refresh');
            }
        };

        this.renderData = function(data, level) {
            var self = this;
            var ul_class = (self.options.headers && parseInt(level) !== parseInt(self.options.level)) ? 'headers' : 'items';
            var li_class = (self.options.headers && parseInt(level) !== parseInt(self.options.level)) ? 'header' : 'item';
            var title_type = (self.options.headers && parseInt(level) !== parseInt(self.options.level)) ? 'title_header_field' : 'title_item_field';
            var add_new = (self.options.headers && parseInt(level) !== parseInt(self.options.level)) ? 'Add header' : 'Add item';


            var $html = $('<ul data-level="' + level + '" class="' + ul_class + ' sortable-' + level + '"></ul>');

            for (i in data) {
                var attr_data = {};

                $.each(self.options[li_class + '_edit_fields'], function(k, v) {
                    attr_data[v[0]] = data[i][v[0]];
                });

                var $part_html = $('<li class="' + li_class + '"></li>');
                $part_html.data(attr_data);
                $part_html.append('<span class="title">' + data[i][self.options[title_type]] + '</span>');
                $part_html.append('<a href="#edit" title="Edit" class="edit"></a>');
                $part_html.append('<a href="#delete" title="Delete" class="delete"></a>');

                if (i !== parseInt(self.options.level) && typeof data[i][self.options.children_field] !== 'undefined') {
                    $part_html.append(self.renderData(data[i][self.options.children_field], (parseInt(level) + 1)));
                }

                $html.append($part_html);
            }

            $html.after('<span class="ui-state-disabled add-' + li_class + '">' + add_new + '</span>');
            return $html;
        };

        /* Events */
        this.onClickEdit = function(new_item) {
            if (this.options.headers && parseInt(this.popupSettings.level) !== parseInt(this.options.level)) {
                this.popupAddHeader(new_item);
            } else {
                this.popupAddItem(new_item);
            }
        };

        this.onClickDelete = function() {
            var self = this;
            var $item = self.popupSettings.$item.parent();

            if ($item.find('ul li').length > 0) {
                var html = '<strong>';
                html += options.delete_message;
                html += '</strong>';

                $('#editorPopup').find('.header').html('Delete Group');
                $('#editorPopup').find('.content').html(html);
                $('#editorPopup').find('.content').attr('data-type', 'delete');
                self.showPopup();
                $clickedItem = $item;
                $('#editorPopup').find('.buttons .add').html('Ok');
            } else {
                self.removeItemOfList($item);

                self.refreshSortable();
                self.refreshData();
            }
        };

        this.initializeEvents = function() {
            var self = this;

            this.$self.find('.listEntries .add-header').on('click', function(e) {
                if (e.preventDefault) e.preventDefault();
                else e.returnValue = false;
                var $self = $(this);
                self.popupSettings = {
                    level: $self.parent().children('ul').attr('data-level'),
                    type: 'new',
                    $item: $self,
                };
                self.popupAddHeader(true);
            });
            this.$self.find('.listEntries .add-item').on('click', function(e) {
                if (e.preventDefault) e.preventDefault();
                else e.returnValue = false;
                var $self = $(this);
                self.popupSettings = {
                    level: $self.parent().children('ul').attr('data-level'),
                    type: 'new',
                    $item: $self,
                };
                self.popupAddItem(true);
            });

            this.$self.find('.listEntries').find('.edit').on('click', function(e) {
                if (e.preventDefault) e.preventDefault();
                else e.returnValue = false;
                var $self = $(this);
                self.popupSettings = {
                    level: $self.parent().parent().attr('data-level'),
                    type: 'edit',
                    $item: $self,
                };
                self.onClickEdit(false);
            });
            this.$self.find('.listEntries').find('.delete').on('click', function(e) {
                if (e.preventDefault) e.preventDefault();
                else e.returnValue = false;
                var $self = $(this);
                self.popupSettings = {
                    level: $self.parent().parent().attr('data-level'),
                    type: 'delete',
                    $item: $self,
                };
                self.onClickDelete();
            });

            this.$self.find('.actionsEditor .loadJson').unbind('click');
            this.$self.find('.actionsEditor .saveJson').unbind('click');
            this.$self.find('.actionsEditor .publishJson').unbind('click');

            this.$self.find('.actionsEditor .loadJson').on('click', function(e) {
                if (e.preventDefault) e.preventDefault();
                else e.returnValue();
                self.loadJson();
            });
            this.$self.find('.actionsEditor .saveJson').on('click', function(e) {
                if (e.preventDefault) e.preventDefault();
                else e.returnValue();
                var data;

                if (typeof self.options.modify_data_before_save === 'function') {
                    data = self.options.modify_data_before_save(self.json_data);
                } else {
                    data = self.json_data;
                }

                self.saveJson(data);
            });
            this.$self.find('.actionsEditor .publishJson').on('click', function(e) {
                if (e.preventDefault) e.preventDefault();
                else e.returnValue();
                var data;

                if (typeof self.options.modify_data_before_publish === 'function') {
                    data = self.options.modify_data_before_publish(self.json_data);
                } else {
                    data = self.json_data;
                }

                self.publishJson(data);
            });

            $('#editorPopup').find('.buttons .add').on('click', function(e) {
                if (e.preventDefault) e.preventDefault();
                else e.returnValue = false;
                self.popupClickAdd();
            });
            $('#editorPopup').find('.buttons .cancel').on('click', function(e) {
                if (e.preventDefault) e.preventDefault();
                else e.returnValue = false;
                self.popupClickCancel();
            });
            $('#editorPopup').find('.close').on('click', function(e) {
                if (e.preventDefault) e.preventDefault();
                else e.returnValue = false;
                self.popupClickCancel();
            });

            $('#editorPopupBck').on('click', function(e) {
                if (e.preventDefault) e.preventDefault();
                else e.returnValue = false;
                self.popupClickCancel();
            });
        };

        /* Popup */
        this.showPopup = function(new_item) {
            var self = this;

            if (typeof new_item === 'undefined') {
                new_item = false;
            }

            var top = $(window).scrollTop();
            $('#editorPopup').css('top', (parseInt(top) + parseInt(self.options.popup_top)) + 'px');
            $('#editorPopup').addClass('active');
            $('#editorPopupBck').addClass('active');
            $('#editorPopup').find('.buttons .add').html((new_item == true ? 'Add' : 'Edit'));
        };

        this.hidePopup = function() {
            var self = this;
            self.options.popup_before_hide(self.popupSettings.$item);
            $('#editorPopup').removeClass('active');
            $('#editorPopupBck').removeClass('active');
            $('#editorPopup').find('.header').html('');
            $('#editorPopup').find('.content').html('');
            $('#editorPopup').find('.buttons .add').html('Add');
            $('#editorPopup').find('.content').attr('data-type', '');
            self.popupSettings = false;
        };

        this.getFieldsHtml = function(fields, type) {
            var html = '';
            var self = this;
            var $item = self.popupSettings.$item.parent();
            var edit = (self.popupSettings.$item.hasClass('ui-state-disabled')) ? false : true;
            var data = (edit === true) ? $item.data() : false;

            for (i in fields) {
                var value = (typeof data[fields[i][0]] !== 'undefined') ? data[fields[i][0]] : '';

                var attr = ['name="' + (type + '_' + fields[i][0]) + '"', 'class="popup-item ' + (type + '_' + fields[i][0]) + ' ' + ((fields[i][1] === 'ckeditor') ? 'ckeditor' : '') + '"', 'data-name=' + fields[i][0], ];

                html += '<div class="' + type + '_' + fields[i][0] + '">';

                switch (fields[i][1]) {
                    case 'ckeditor':
                    case 'textarea':
                        html += '<label for="' + type + '_' + fields[i][0] + '">' + (typeof fields[i][5] !== 'undefined' ? fields[i][5] : fields[i][0]) + '</label>';
                        html += '<textarea ' + attr.join(' ') + ' >';
                        html += value;
                        html += '</textarea>';
                        break;
                    case 'select':
                        var options = '';
                        var values = fields[i][2];
                        if ($.isArray(values)) {
                            /*
                             * format [value, label]
                             */
                            $.each(values, function(i, v) {
                                var val = v[0];
                                var label = v[1];
                                var selected = (val === value) ? 'selected' : '';
                                options += '<option value=' + val + ' ' + selected + '>';
                                options += label;
                                options += '</option>';
                            })
                        } else {
                            /*
                             * format [value] => label
                             */
                            for (j in values) {
                                var selected = (j === value) ? 'selected' : '';
                                options += '<option value=' + j + ' ' + selected + '>';
                                options += values[j];
                                options += '</option>';
                            }
                        }


                        html += '<label for="' + type + '_' + fields[i][0] + '">' + (typeof fields[i][5] !== 'undefined' ? fields[i][5] : fields[i][0]) + '</label>';
                        html += '<select ' + attr.join(' ') + ' >';
                        html += options;
                        html += '</select>';
                        break;
                    case 'checkbox':
                        var checked = (value === 1) ? 'checked' : '';

                        html += '<input type="checkbox" ' + attr.join(' ') + ' ' + checked + ' />';
                        html += '<label for="' + type + '_' + fields[i][0] + '">' + (typeof fields[i][5] !== 'undefined' ? fields[i][5] : fields[i][0]) + '</label>';

                        break;
                    default:
                        var typ = 'type="' + fields[i][1] + '"';
                        var val = 'value="' + value + '"';
                        attr.push(typ);
                        attr.push(val);
                        html += '<label for="' + type + '_' + fields[i][0] + '">' + (typeof fields[i][5] !== 'undefined' ? fields[i][5] : fields[i][0]) + '</label>';
                        html += '<input ' + attr.join(' ') + ' />';
                }

                html += '</div>';
            }

            return html;
        };

        this.popupAddHeader = function(new_item) {
            this.showPopup(new_item);

            var self = this;
            var fields = this.options.header_edit_fields;
            var html = '';

            html += self.getFieldsHtml(fields, 'header');

            $('#editorPopup').find('.header').html('Add / Edit Header');
            $('#editorPopup').find('.content').attr('data-type', 'header');
            $('#editorPopup').find('.content').html(html);
            $('#editorPopup').find('.content textarea').tinyCkEditor(narrativeSettings);
            self.options.popup_after_show(self.popupSettings.$item);
        };

        this.popupAddItem = function(new_item) {
            this.showPopup(new_item);

            var self = this;
            var fields = this.options.item_edit_fields;
            var html = '';

            html += self.getFieldsHtml(fields, 'item');

            $('#editorPopup').find('.header').html('Add / Edit item');
            $('#editorPopup').find('.content').attr('data-type', 'item');
            $('#editorPopup').find('.content').html(html);

            if ($('#editorPopup').find('.content .ckeditor').length > 0) {
                $('#editorPopup').find('.content .ckeditor').each(function() {
                    var $self = $(this);
                    var val = $self.html();
                    var settings = $.extend({}, narrativeSettings);
                    settings.html = val;
                    $self.tinyCkEditor(settings);
                });
            }

            self.options.popup_after_show(self.popupSettings.$item);
        };

        this.addNewItem = function(type, attr) {
            var self = this;
            var title_type = (type == 'header') ? 'title_header_field' : 'title_item_field';
            var level = self.options.level;

            var $html = $('<li class="' + type + '"></li>');
            $html.data(attr);
            $html.append('<span class="title">' + attr[self.options[title_type]] + '</span>');
            $html.append('<a href="#edit" title="Edit" class="edit"></a>');
            $html.append('<a href="#delete" title="Delete" class="delete"></a>');

            if (parseInt(self.options.level) > parseInt(self.popupSettings.level)) {
                var new_type = (parseInt(self.options.level) !== (parseInt(self.popupSettings.level) + 1)) ? type : 'item';
                $html.append('<ul data-level="' + level + '" class="' + new_type + ' sortable-' + (parseInt(self.popupSettings.level) + 1) + '"></ul>');
                $html.append('<span class="ui-state-disabled add-' + new_type + '">Add ' + new_type + '</span>');
                $html.find('ul').sortable({
                    placeholder: "ui-state-highlight",
                    connectWith: ".listEntries .sortable-" + (parseInt(self.popupSettings.level) + 1),
                    items: "> li",
                    handle: '> .title',
                    update: function() {
                        self.refreshData();
                    },
                });
            } else {
                self.refreshSortable();
            }

            return $html;
        }

        this.popupClickCancel = function() {
            this.hidePopup();
        };

        this.popupClickAdd = function() {
            var self = this;
            var $html = false;
            var error = false;
            var type = $('#editorPopup').find('.content').attr('data-type');
            var attr = {};

            $('#editorPopup').find('.content .popup-item').each(function(i) {
                var $self = $(this);
                var name = $self.attr('data-name');
                if ($self.hasClass('ckeditor')) {
                    var value = $self.tinyCkEditor("getContent");
                    if (value === false) value = '';
                } else if ($self.is('select')) {
                    var value = $self.find('option:selected').val();
                } else if ($self.is('[type=checkbox]')) {
                    var value = $self.is(':checked') ? 1 : 0;
                } else {
                    var value = $self.val();
                }

                attr[name] = value;
            });

            for (i in self.options[type + '_edit_fields']) {

                if (typeof self.options[type + '_edit_fields'][i][3] !== 'undefined') {
                    var name = self.options[type + '_edit_fields'][i][0];
                    var regex = self.options[type + '_edit_fields'][i][3];
                    var error_message = (typeof self.options[type + '_edit_fields'][i][4] !== 'undefined') ? self.options[type + '_edit_fields'][i][4] : default_error_message;

                    if (regex.test(attr[name]) === false) {
                        if ($('#editorPopup').find('[name="' + type + '_' + name + '"]').parent().find('.error').length < 1) {
                            $('#editorPopup').find('[name="' + type + '_' + name + '"]').after('<em class="error"></em>');
                        }
                        $('#editorPopup').find('[name="' + type + '_' + name + '"]').parent().find('.error').html(error_message);
                        error = true;
                    }
                }
            }

            if (error === true) {
                return;
            }


            switch (self.popupSettings.type) {
                case 'new':
                    $html = self.addNewItem(type, attr);

                    $html.find('.add-header').on('click', function(e) {
                        if (e.preventDefault) e.preventDefault();
                        else e.returnValue = false;
                        var $self = $(this);
                        self.popupSettings = {
                            level: $self.parent().children('ul').attr('data-level'),
                            type: 'new',
                            $item: $self,
                        };
                        self.popupAddHeader(true);
                    });
                    $html.find('.add-item').on('click', function(e) {
                        if (e.preventDefault) e.preventDefault();
                        else e.returnValue = false;
                        var $self = $(this);
                        self.popupSettings = {
                            level: $self.parent().children('ul').attr('data-level'),
                            type: 'new',
                            $item: $self,
                        };
                        self.popupAddItem(true);
                    });

                    var new_type = (parseInt(self.options.level) !== (parseInt(self.popupSettings.level) + 1)) ? type : 'item';

                    $html.find('.sortable-' + self.popupSettings.level).sortable({
                        placeholder: "ui-state-highlight",
                        connectWith: '.listEntries .sortable-' + self.popupSettings.level,
                        dropOnEmpty: true,
                        items: "li",
                        update: self.refreshData
                    });

                    $html.find('.sortable-' + self.popupSettings.level).disableSelection();

                    $html.find('.edit').on('click', function(e) {
                        if (e.preventDefault) e.preventDefault();
                        else e.returnValue = false;
                        var $self = $(this);
                        self.popupSettings = {
                            level: $self.parent().parent().attr('data-level'),
                            type: 'edit',
                            $item: $self,
                        };
                        self.onClickEdit(false);
                    });

                    $html.find('.delete').on('click', function(e) {
                        if (e.preventDefault) e.preventDefault();
                        else e.returnValue = false;
                        var $self = $(this);
                        self.popupSettings = {
                            level: $self.parent().parent().attr('data-level'),
                            type: 'delete',
                            $item: $self,
                        };
                        self.onClickDelete();
                    });

                    self.popupSettings.$item.parent().children('ul').append($html);
                    break;
                case 'edit':
                    $html = self.popupSettings.$item.parent();
                    $html.data(attr);

                    var title_type = (parseInt(self.options.level) !== parseInt(self.popupSettings.level)) ? 'title_header_field' : 'title_item_field';

                    $html.children('.title').text(attr[self.options[title_type]]);
                    self.refreshSortable();
                    break;
                case 'delete':
                    self.removeItemOfList($clickedItem);
                    break;
            }

            self.refreshData();
            self.hidePopup();
        };

        this.removeItemOfList = function($self) {
            $self.remove();
        }

        this.getDataForRefresh = function($parent, level) {
            var $items = $parent.children('li');
            var self = this;
            var result = [];

            $items.each(function(i) {
                var $item = $(this);
                var fields = (self.options.headers && parseInt(self.options.level) !== parseInt(level)) ? self.options.header_edit_fields : self.options.item_edit_fields;
                var all_data = $item.data();
                var data = {};

                for (i in fields) {
                    data[fields[i][0]] = (typeof all_data[fields[i][0]] !== 'undefined') ? all_data[fields[i][0]] : '';
                }

                if (parseInt(self.options.level) !== parseInt(level)) {
                    var $new_parent = $item.children('ul');

                    if ($new_parent.length > 0) {
                        data[self.options.children_field] = self.getDataForRefresh($new_parent, (parseInt(level) + 1));
                    } else {
                        data[self.options.children_field] = [];
                    }
                }

                result.push(data);
            });

            return result;
        };

        this.refreshData = function() {
            if (typeof this.options.refreshData === 'function') {
                this.options.refreshData(this);
            } else {
                var $parent = this.$self.find('.listEntries > ul');
                var new_data = this.getDataForRefresh($parent, 0);
                this.json_data = new_data;
            }
        };

        /* Spinner */
        this.spinner = function(show) {
            if (show) this.$self.find('.spinnerEditor').addClass('loading');
            else this.$self.find('.spinnerEditor').removeClass('loading');
        };


        this.init = function(opt, $self) {
            this.$self = $self;
            this.popupSettings = false;

            this.options = $.extend({}, options, opt);
            this.json_data = {};

            var width = (this.options.popup_width > 200) ? this.options.popup_width : 200;
            narrativeSettings.editor.width = width - 50;
            $('#editorPopup').css('width', width + 'px').css('margin-left', '-' + (width / 2) + 'px');

            this.loadJson();
            this.getPublishedData();
        };

        this.init(opt, $self);

        return this;
    };

})(jQuery);