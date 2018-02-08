
Hypergrid drag and drop Proof of Concept
----------------------------------------

The milestones of this project are:
(see them on on-line-staging)

02-swap-columns-by-click-on-headers.html
    learning hypergrid-API

17-swap-by-drag
    swap17-swaps-by-drag-and-drop---not-by-move-and-click-delivery.html

18-drags-and-drops
    drag18-drags-and-drops-without-fancies.html

drag-23-drag-to-hole-strip----needs-to-polish-decorations.html
    Feb 5, 2018
    events moved to DOM. the only still API event is fin-mousedown
    drag concept:
        1. when drag starts, the application creates twins of columns
            each twin is a new canvas which is a clone of original column
        2. while dragging, the original grid-canvas moves into background and is ignored
            the twins move to the foreground and paly with dragging column, make
            gray-hole-strip which follows the dragged column
        3. when mouse-up happens animation wents to finalizing stage
            at this stage the dragged column-canvas moves into the hole-strip
            (by css transition)
            the twins move into the backtround

            at the same time, in "dataModel", columns do make shift and swap
        4. the original, updated grid comes from the background

        5. animation and swaps are done

Feb 7. index-core-drag.html
    NOT FOR PRODUCTION ... this is a proof of concept ... it does not work with all cases
    it should not work for columns which were hidden before ... this needs obvious work

    in this experiment, the above drag and drop plugin is ported to the "gulp-build"
    as a require.js module

    To run this file, complete
    gulp browserify-demo
    and then land like localhost/... index-core-drag.html


         
