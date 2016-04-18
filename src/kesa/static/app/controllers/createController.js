(function () {
    "use strict";

    angular.module('storyTeller')
        .controller('createController', function (MiscService, $location, storyService) {
            var id = location.pathname.substring(1, location.pathname.indexOf("story") - 1);

            var ctrl = this;

            ctrl.createID = id;
            ctrl.title = "";
            ctrl.is_complete = false;
            var treeData = null;

            var root, currentNode, tree, diagonal, svg;

            var peer = null;
            var conn = [];
            var index = -1;
            var leader = false;
            var closed = false;
            var editMode = false;


            var i = 0,
                duration = 750;

            storyService.getStory(id, function (err, data) {
                if (err) {
                    console.log("error in getting data");
                }
                else {
                    treeData = [data];

                    storyService.setOpen(ctrl.createID, function (err, data) {
                        if (err) {
                            console.log("error in getting data");
                        }
                    });

                    // Source http://bl.ocks.org/d3noob/8375092
                    if (treeData === undefined || treeData === null || treeData[0] === "undefined" ||
                        (Object.keys(treeData).length === 0
                        && (JSON.stringify(treeData) === JSON.stringify({})
                        || JSON.stringify(treeData) === JSON.stringify([])))) {

                        treeData =
                            [
                                {
                                    "name": "Start writing your story!",
                                    "body": "C'mon bruv you can do it.",
                                    "title": "Story Session"
                                }
                            ];

                    }

                    // Setting up the graph canvas
                    var w = d3.select(".tree-container").style("width");
                    var widthlen = w.length;

                    d3.select(".tree-container").style("height", screen.height + "px");

                    var margin = {top: 20, right: 120, bottom: 20, left: -20},
                        width = parseInt(w.slice(0, widthlen - 2)) - margin.right - margin.left,
                        height = 3000 - margin.top - margin.bottom;


                    tree = d3.layout.tree()
                        .size([width, height]);

                    diagonal = d3.svg.diagonal()
                        .projection(function (d) {
                            return [d.x, d.y];
                        });

                    svg = d3.select(".tree-container").append("svg")
                        .attr("width", width + margin.right + margin.left)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    root = treeData[0];
                    root.x0 = height / 2;
                    root.y0 = 0;
                    currentNode = root;
                    ctrl.title = root.title;

                    ctrl.click(root);
                    ctrl.update(root, true, true);

                    // TODO: Not certain what this is, figure it out
                    d3.select(self.frameElement).style("height", "500px");

                    ctrl.createSession();
                }
            });

            this.applyChanges = function (response) {
                switch (response.action) {
                    case 0:
                        // Add a branch
                        var newBranch =
                        {
                            "name": response.name,
                            "body": response.body
                        };
                        console.log(response.parentid);
                        MiscService.addRemoteBranchr(root, newBranch, response.parentid);

                        var contact = MiscService.findContactNoder(root, response.parentid);

                        console.log(contact);
                        console.log(root);
                        if (contact.some) {
                            ctrl.update(contact.obj, false, false);

                            var oldlength = contact.obj.children.length;
                            storyService.addToStory(ctrl.createID, oldlength, contact.obj.branchid, response, function (err, data, length, contact) {
                                if (err) {
                                    console.log("error in getting data");
                                } else {
                                    currentNode.children[currentNode.children.length - 1].branchid = data["result"];

                                    var toSend = MiscService.createPacket(4, null, data["result"]);
                                    toSend.myid = peer.id;

                                    contact.peer.send(MiscService.stringify(toSend));

                                    storyService.addContribution(response.user, ctrl.createID, function (err, data) {
                                        if (err) {
                                            console.log("error in getting data");
                                        }
                                    });
                                }
                            });
                        } else {
                            console.log("should not be here");
                        }

                        break;
                    case 2:
                        // Edit a branch
                        contact = MiscService.findContactNoder(root, response.currentid);
                        contact.obj.name = response.name;
                        contact.obj.body = response.body;

                        if (contact.some) {
                            storyService.editStory(ctrl.createID, contact.obj.branchid, contact.obj, response, function (err, data, response) {
                                if (err) {
                                    console.log("error in getting data");
                                } else {
                                    if (data["result"] === "true") {
                                        ctrl.update(contact.obj, false, false, 0, null);
                                        if (contact.obj.id == currentNode.id) {
                                            ctrl.click(currentNode);
                                        }
                                        storyService.addContribution(response.user, ctrl.createID, function (err, data) {
                                            if (err) {
                                                console.log("error in getting data");
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            console.log("should not be here");
                        }
                        break;
                    case 3:
                        var arr = conn.filter(function (element) {
                            return (element.peer === response.myid);
                        });
                        if (arr.length === 1) {
                            arr[0].gotData = true;
                        }
                        break;
                    case 5:
                        var arr = conn.filter(function (element) {
                            return (element.peer === response.myid);
                        });
                        var currentindex = conn.indexOf(arr[0]);
                        conn = conn.splice(0, currentindex).concat(conn.splice(currentindex + 1, index + 1));
                        index = index - 1;
                        break;
                    default:
                        console.log("Block code unrecognized, doing nothing");
                }

            };

            this.createSession = function () {
                peer = new Peer(ctrl.createID, {host: 'storypeerserver.herokuapp.com', secure: true, port: 443});

                leader = true;
                peer.on('open', function (id) {
                    ctrl.update(root, true, true);
                });

                peer.on('connection', function (connec) {
                    conn.push(connec);
                    connec.gotData = false;
                    index = index + 1;

                    var initJSON = {};
                    console.log("sending initial data structure");
                    initJSON.initRoot = MiscService.toJSON(root);
                    initJSON.title = ctrl.title;
                    initJSON.action = 3;

                    var currentIndex = index;
                    conn[currentIndex].on('data', function (data) {
                        var response = JSON.parse(data);
                        conn.filter(function (element) {
                            return element.peer === response.myid;
                        });
                        var tempindex = conn.indexOf(conn[0]);
                        response.peer = conn[tempindex];
                        ctrl.applyChanges(response);

                        // Pass on the information to all other peers
                        conn.forEach(function (element) {
                            if (element.peer !== response.myid) {
                                element.send(data);
                            }
                        });
                    });


                    setInterval(function () {
                        conn.forEach(function (element) {
                            if (!element.gotData) {
                                element.send(MiscService.stringify(initJSON));
                                console.log("Send to " + element.peer);
                                console.log(element);
                            }
                        });
                    }, 2000);
                });

            };

            this.update = function (source, sendToPeers, changeCurrentNode, action, specialNode) {

                var cont = d3.select(".story-container");

                if (closed) {
                    cont.classed("col-xs-4", true)
                        .classed("animated", true)
                        .classed("fadeInRightBig", true);
                }

                d3.select(".tree-container").classed("col-xs-7", true);

                // Compute the new tree layout.
                var nodes = tree.nodes(root),
                    links = tree.links(nodes);

                // Normalize for fixed-depth.
                nodes.forEach(function (d) {
                    d.y = d.depth * 180;
                });

                // Update the nodes…
                var node = svg.selectAll("g.node")
                    .data(nodes, function (d) {
                        return d.id || (d.id = ++i);
                    });

                // Enter any new nodes at the parent's previous position.
                var nodeEnter = node.enter().append("g")
                    .attr("class", "node")
                    .attr("transform", function (d) {
                        return "translate(" + source.x0 + "," + source.y0 + ")";
                    })
                    .on("click", ctrl.click);

                nodeEnter.append("circle")
                    .attr("r", 1e-6)
                    .style("fill", function (d) {
                        return d._children ? "lightsteelblue" : "#fb5e58";
                    });

                nodeEnter.append("text")
                    .attr("x", function (d) {
                        return d.children || d._children ? -13 : 13;
                    })
                    .attr("dy", ".35em")
                    .attr("text-anchor", function (d) {
                        return d.children || d._children ? "end" : "start";
                    })
                    .text(function (d) {
                        return d.name;
                    })
                    .style("fill-opacity", 1e-6);

                // Transition nodes to their new position.
                var nodeUpdate = node.transition()
                    .duration(duration)
                    .attr("transform", function (d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    });

                nodeUpdate.select("circle")
                    .attr("r", 10)
                    .style("fill", function (d) {
                        return d._children ? "#fb5e58" : "#fff";
                    });

                nodeUpdate.select("text")
                    .style("fill-opacity", 1)
                    .text(function (d) {
                        return d.name;
                    });

                // Transition exiting nodes to the parent's new position.
                var nodeExit = node.exit().transition()
                    .duration(duration)
                    .attr("transform", function (d) {
                        return "translate(" + source.x + "," + source.y + ")";
                    })
                    .remove();

                nodeExit.select("circle")
                    .attr("r", 1e-6);

                nodeExit.select("text")
                    .style("fill-opacity", 1e-6);

                // Update the links…
                var link = svg.selectAll("path.link")
                    .data(links, function (d) {
                        return d.target.id;
                    });

                // Enter any new links at the parent's previous position.
                link.enter().insert("path", "g")
                    .attr("class", "link")
                    .attr("d", function (d) {
                        var o = {x: source.x0, y: source.y0};
                        return diagonal({source: o, target: o});
                    });

                // Transition links to their new position.
                link.transition()
                    .duration(duration)
                    .attr("d", diagonal);

                // Transition exiting nodes to the parent's new position.
                link.exit().transition()
                    .duration(duration)
                    .attr("d", function (d) {
                        var o = {x: source.x, y: source.y};
                        return diagonal({source: o, target: o});
                    })
                    .remove();

                // Stash the old positions for transition.
                nodes.forEach(function (d) {
                    d.x0 = d.x;
                    d.y0 = d.y;
                });

                if (changeCurrentNode) {

                    cont.html("");

                    cont.append("div")
                        .classed("close-story-button", true)
                        .text("x")
                        .on("click", ctrl.removeSide);

                    if (editMode === true) {
                        cont.append("textarea")
                            .classed("expanding", true)
                            .classed("title-edit", true)
                            .text(source.name);

                        cont.append("textarea")
                            .classed("expanding", true)
                            .classed("body-edit", true)
                            .text(source.body);

                        cont.append("div")
                            .classed("save-branch-button", true)
                            .classed("col-xs-5", true)
                            .text("save")
                            .on("click", ctrl.saveBranch);

                        cont.append("div")
                            .classed("edit-branch-button", true)
                            .classed("col-xs-5", true)
                            .text("cancel")
                            .on("click", ctrl.editBranch);

                        ctrl.addTextArea();

                    } else {
                        cont.append("div")
                            .classed("story-section-title", true)
                            .text(source.name);

                        cont.append("div")
                            .classed("story-section-body", true)
                            .text(source.body);
                        cont.append("div")
                            .classed("add-branch-button", true)
                            .text("add branch")
                            .on("click", ctrl.addBranch);

                        cont.append("div")
                            .classed("delete-branch-button", true)
                            .classed("col-xs-5", true)
                            .text("delete branch")
                            .on("click", ctrl.deleteBranch);

                        cont.append("div")
                            .classed("edit-branch-button", true)
                            .classed("col-xs-5", true)
                            .text("edit branch")
                            .on("click", ctrl.editBranch);

                        cont.append("div")
                            .classed("edit-branch-button", true)
                            .classed("col-xs-5", true)
                            .text("Publish Story")
                            .on("click", ctrl.Publish);
                    }


                    currentNode = source;
                    closed = false;
                }

                if (sendToPeers) {
                    conn.forEach(function (element) {
                        var toSend = MiscService.createPacket(action, specialNode, source.id);
                        element.send(MiscService.stringify(toSend));
                    });
                }
            };

            // Toggle children on click.
            this.click = function (d) {
                currentNode._children = null;
                if (d.children) {
                    d._children = [{"somev": "hello"}];
                } else {
                    d._children = [{"somev": "hello"}];
                }
                window.scroll(0, ctrl.findPos(d));
                ctrl.update(d, false, true, -1, null);
            };

            this.addBranch = function () {
                // If not leaf
                var obj = {};
                if (currentNode.children) {
                    obj = {
                        "name": "Empty Branch",
                        "body": "Add something here!"
                    };
                    currentNode.children.push(obj);
                } else {
                    obj = {
                        "name": "Empty Branch",
                        "body": "Add something here!"
                    };
                    currentNode.children = [];
                    currentNode.children.push(obj);
                }
                var specialNode = {"name": obj.name, "body": obj.body, "parentid": currentNode.id, "action": 0};
                ctrl.update(currentNode, true, true, 0, specialNode);

                var oldlength = currentNode.children.length;
                storyService.addToStory(ctrl.createID, oldlength, currentNode.branchid, null, function (err, data, length, contact) {
                    if (err) {
                        console.log("error in getting data");
                    } else {
                        currentNode.children[currentNode.children.length - 1].branchid = data["result"];
                    }
                });
            };

            this.deleteBranchr = function (parent, branch, id) {
                if (branch.id == id) {
                    for (var i = 0; i < parent.children.length; i++) {
                        if (parent.children[i].id == id) {
                            parent.children.splice(i, 1);
                        }
                    }
                    return 1;
                } else if (branch.children) {
                    branch.children.forEach(function (d) {
                        ctrl.deleteBranchr(branch, d, id);
                    });
                    return 0;
                } else {
                    // Didn't find anything
                    return 0;
                }
            };

            this.deleteBranch = function () {
                if (currentNode === root) {
                    MiscService.customAlert("<strong>Node is the root,</strong> cannot delete the root");
                } else {
                    storyService.deleteBranch(ctrl.createID, currentNode.branchid, function (err, data) {
                        if (err) {
                            console.log("error in getting data");
                        } else {
                            if (data["result"] === 'true') {
                                ctrl.deleteBranchr(null, root, currentNode.id);
                                ctrl.update(currentNode, true, false, 1, null);
                                ctrl.click(currentNode.parent);
                            }
                        }
                    });
                }
            };

            this.editBranch = function () {
                editMode = !editMode;
                ctrl.update(currentNode, false, true, -1, null);

            };

            this.saveBranch = function () {
                currentNode.name = angular.element(".title-edit").val();
                currentNode.body = angular.element(".body-edit").val();
                var specialNode = {
                    "name": currentNode.name,
                    "body": currentNode.body,
                    "currentid": currentNode.id,
                    "action": 2
                };
                editMode = false;


                storyService.editStory(ctrl.createID, currentNode.branchid, currentNode, null, function (err, data, response) {
                    if (err) {
                        console.log("error in getting data");
                    } else {
                        if (data["result"] === "true") {
                            ctrl.update(currentNode, true, true, 2, specialNode);
                        }
                    }
                });
            };

            //Finds y value of given object
            this.findPos = function (obj) {
                var curtop = 0;
                if (obj.offsetParent) {
                    do {
                        curtop += obj.offsetTop;
                    } while (obj = obj.offsetParent);
                    return [curtop];
                }
            };

            this.removeSide = function () {
                closed = true;
                d3.select(".story-container").html("")
                    .classed("col-xs-4", false)
                    .classed("animated", false)
                    .classed("fadeInRightBig", false);
                d3.select(".tree-container").classed("col-xs-7", false);
            };

            //Source - http://jsfiddle.net/bgrins/UA7ty/
            this.addTextArea = function () {

                var cloneCSSProperties = [
                    'lineHeight', 'textDecoration', 'letterSpacing',
                    'fontSize', 'fontFamily', 'fontStyle',
                    'fontWeight', 'textTransform', 'textAlign',
                    'direction', 'wordSpacing', 'fontSizeAdjust',
                    'whiteSpace', 'wordWrap'
                ];

                var textareaCSS = {
                    overflow: "hidden",
                    position: "absolute",
                    top: "0",
                    left: "0",
                    height: "100%",
                    resize: "none"
                };

                var preCSS = {
                    display: "block",
                    visibility: "hidden"
                };

                var containerCSS = {
                    position: "relative"
                };

                var initializedDocuments = {};

                function resize(textarea) {
                    $(textarea).parent().find("span").text(textarea.value);
                }

                function initialize(document) {
                    // Only need to initialize events once per document
                    if (!initializedDocuments[document]) {
                        initializedDocuments[document] = true;

                        $(document).delegate(
                            ".expandingText textarea",
                            "input onpropertychange",
                            function () {
                                resize(this);
                            }
                        );
                    }
                }

                $.fn.expandingTextarea = function () {

                    return this.filter("textarea").each(function () {

                        initialize(this.ownerDocument || document);

                        var textarea = $(this);

                        textarea.wrap("<div class='expandingText'></div>");
                        textarea.after("<pre class='textareaClone'><span></span><br /></pre>");

                        var container = textarea.parent().css(containerCSS);
                        var pre = container.find("pre").css(preCSS);

                        textarea.css(textareaCSS);

                        $.each(cloneCSSProperties, function (i, p) {
                            pre.css(p, textarea.css(p));
                        });

                        resize(this);
                    });
                };

                $.fn.expandingTextarea.initialSelector = "textarea.expanding";

                $(function () {
                    $($.fn.expandingTextarea.initialSelector).expandingTextarea();
                });

            };

            this.Publish = function () {
                storyService.setComplete(ctrl.createID, function (err, data) {
                    if (err) {
                        console.log("error in getting data");
                    } else {
                        ctrl.is_complete = true;
                        location.pathname = "/" + ctrl.createID + "/story";
                    }
                });
            };

            window.addEventListener("beforeunload", function (e) {
                var toSend = null;
                if (ctrl.is_complete) {
                    toSend = MiscService.createPacket(6, null, null);
                } else {
                    toSend = MiscService.createPacket(5, null, null);
                }

                toSend.myid = peer.id;
                for (var i = 0; i < conn.length; i++) {
                    conn[i].send(MiscService.stringify(toSend));
                }
                peer.disconnect();

                storyService.setClosed(ctrl.createID, function (err, data) {
                    if (err) {
                        console.log("error in getting data");
                    }
                });
            });
        });
})
();