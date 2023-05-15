const inf = Number.NEGATIVE_INFINITY

export type BuilderFn = (old: HTMLElement, row: number, column: number) => void
export type EstimatorFn = (start: number, end: number) => number
export interface Column {
    width: number
}

// we can have panes that are separately scrollable, but locked on one dimension (only outer panes have scroll bars)


export interface ScrollPos {
    row: number
    column: number
}

export interface Pane {
    // in pixels
    start: number
    end: number
}

export interface ScrollerProps {
    container: HTMLElement
    rows: number
    columns: number

    paneRow: Pane[]
    paneColumn: Pane[]
    freezeRow: boolean  // first pane can't be scrolled.
    freezeColumn: boolean

    height: number | EstimatorFn
    builder: BuilderFn,  // render cell as html

    topPadding?: number
    columnTemplate: Column | Column[] // repeated as many times as needed
    initial?: ScrollPos
}

interface GridUpdate {
    props: ScrollerProps  // new description
    // these must be sorted and not overlap.
    // the index for an insert is new location of the row, others will be shifted down
    // we could calulate by diff? how do we move/reorder rows or columns?
    rows: [Op, number, number][]
    columns: [Op, number, number][]
}





function rotate<T>(a: T[], n: number) {
    a.unshift.apply(a, a.splice(n, a.length));
    return a;
}

// index is given to builder to build the dom. inf indicates nto as
class Item {
    constructor(public node: HTMLElement) { }
    // on an update we can scan this to 
    height = 0
    width = 0
    top = 0
    //get isTombstone() { return !!this.data }
    // do we need this? and when would not show a cell?
    show(x: boolean) {
        this.node.style.display = x ? 'block' : 'none'
    }
}

// index is the top visible item, offset is how far scroll off the top it is (0 is flush to top)
interface Anchor {
    index: number
    offset: number
}

export enum Op {
    Insert,
    Delete,
    Update,
}


// GridUpdate should be related to the initial parameters
// It is a delta though, which allows us to handle animiation here if we want.


// these should only be on our runway. doesn't need to start at 0.
// when we get a snapshot update we should diff the T's to see if we can reuse the dom we have created.
//rendered_start_ = 0
// wraps around a dom element; portrays a Snapshot stream.
// to be wrapped by react with useEffect.
export class Scroller {
    scroller_: HTMLElement
    builder: BuilderFn
    rendered_: Item[] = [];
    length_ = 0
    topPadding = 0
    anchorItem: Anchor = { index: 0, offset: 0 }
    width_: number = 0// exact. we may need

    anchorScrollTop = 0; // this is in pixels
    heightAbove = 0

    // measured height is some of all the formatted rows
    measuredHeight_ = 0;
    // adds in the estimations
    estHeight_ = 0

    scrollRunway_: HTMLElement  // Create an element to force the scroller to allow scrolling to a certainpoint.
    wideWay_: HTMLElement


    // when we create a div it should be display none and absolute and a child of the scroller
    // tombstone.style.position = 'absolute'
    // this.scroller_.appendChild(tombstone)
    div(): HTMLElement {
        const r = document.createElement('div') as HTMLElement
        this.scroller_.append(r)
        r.style.position = 'absolute'
        r.style.display = 'block'
        return r
    }

    constructor(public props: ScrollerProps) {
        this.scroller_ = props.container
        console.log('props', props)
        this.length_ = props.rows
        this.topPadding = props.topPadding ?? 0
        this.builder = (o: HTMLElement, row: number, col: number) => {
            console.log("builder", row, col)
            if (row < 0 || row >= props.rows) {
                // cache this? get from callback?
                o = this.div()
            } else {
                props.builder(o, row, col)
            }
        }
        this.anchorItem.index = props.initial?.row ?? 0

        this.scroller_.addEventListener('scroll', () => this.onScroll_());
        const fd = () => {
            const d = document.createElement('div');
            d.textContent = ' ';
            d.style.position = 'absolute';
            d.style.height = '1px';
            d.style.width = '1px';
            d.style.transition = 'transform 0.2s';
            this.scroller_.appendChild(this.scrollRunway_);
            return d
        }
        this.scrollRunway_ = fd()
        this.wideWay_ = fd()

        this.resizeData()
        this.onResize_()
    }

    close() {
        this.scroller_.replaceChildren()
    }

    update(update: GridUpdate) {
        // this can be called on resize
        // 
    }
    // called when the number or rows changes, but is this necessary?
    resizeData() {
        // 50 might not be enough? 4000/24 = 166
        let target = Math.min(this.length_, 200)

        if (target > this.rendered_.length) {
            let b = this.rendered_.length
            for (; b < target; b++) {
                let o = this.div()
                this.builder(o, b, 0)
                let i = new Item(o)
                this.rendered_.push(i)
            }
        } else {
            // truncates the rendered array
            this.rendered_.length = target
        }
    }

    // we might start rendering 10 rows before the anchor.
    // we we are ok with negive index here and handle it elsewhere?
    get rendered_start(): number {
        const b = Math.max(0, this.anchorItem.index - 10)
        return Math.min(b, this.length_ - this.rendered_.length)
    }
    // height above the anchor, we should cache this. changes on a scroll though.

    onResize_() {
        for (let o of this.rendered_) {
            this.measure(o)
        }

        this.anchorScrollTop = this.heightAbove + this.props.estimateHeight(0, this.rendered_start)
        //this.rendered_start * this.tombstoneHeight_
        this.scroller_.scrollTop = this.anchorScrollTop
        this.adjustHeight()
        this.repositionAll()
        this.onScroll_()
        console.log('size', { ...this.anchorItem, top: this.scroller_.scrollTop, st: this.rendered_start, h: this.estHeight_ })
        console.log('resize', this.anchorScrollTop, this.anchorItem.index, this.anchorItem.offset)
    }
    repositionAll() {
        let pos = this.anchorScrollTop - this.heightAbove
        for (let o of this.rendered_) {
            o.top = pos
            this.position(o)
            pos += o.height
        }
    }

    position(o: Item) {
        o.node.style.transform = `translateY(${o.top + this.topPadding}px)`
    }
    measure(item: Item) {
        this.measuredHeight_ -= item.height
        item.height = item.node.offsetHeight
        item.width = item.node.offsetWidth
        this.measuredHeight_ += item.height
    }
    // adjust height lazily, try to avoid it.
    // we need at least what we have measured, but if we change it we should add the tombstones.
    // we should only change height at the top when we measure the first item.
    adjustHeight() {
        const th = this.props.estimateHeight(0, 1) // not right
        const rendered_start = this.rendered_start

        if (rendered_start == 0) {
            const tombstones = this.length_ - this.rendered_.length
            const h = this.measuredHeight_ + tombstones * th
            if (h != this.estHeight_) {
                this.height = h
                this.scroller_.scrollTop = this.heightAbove
                this.repositionAll
            }
        } else if (rendered_start + this.rendered_.length >= this.length_) {
            const heightBelow = this.measuredHeight_ - this.heightAbove
            const ta = this.anchorScrollTop + heightBelow
            this.height = ta
        } else {
            const tombstones = this.length_ - rendered_start - this.rendered_.length
            const heightBelow = this.measuredHeight_ - this.heightAbove
            const ta = this.anchorScrollTop + heightBelow
            if (ta > this.estHeight_) {
                this.height = ta + tombstones * th
            }
        }
    }
    set height(est: number) {
        if (est != this.estHeight_) {
            this.scrollRunway_.style.transform = `translate(0,${est}px)`;
            this.estHeight_ = est
        }
    }
    set width(w: number) {
        this.wideWay_.style.transform = `translate(${w}px,0)`;
    }

    calculateAnchoredItem(initialAnchor: Anchor, delta: number): Anchor {
        const th = this.props.estimateHeight(0, 1) // not right
        if (delta == 0)
            return initialAnchor;
        const rendered_start = this.rendered_start
        delta += initialAnchor.offset;
        var i = initialAnchor.index - rendered_start
        var tombstones = 0;
        if (delta < 0) {
            while (delta < 0 && i > 0) {
                delta += this.rendered_[i - 1].height;
                i--;
            }
            tombstones = Math.max(-i, Math.ceil(Math.min(delta, 0) / th))
        } else {
            while (delta > 0 && i < this.rendered_.length && this.rendered_[i].height < delta) {
                delta -= this.rendered_[i].height;
                i++;
            }
            if (i >= this.rendered_.length)
                tombstones = Math.floor(Math.max(delta, 0) / th);
        }
        return {
            index: i + rendered_start + tombstones,
            offset: delta - tombstones * th,
        };
    }

    // note that each cell must be a number of lines? don't we need to be able to position by line? cell is too course. is pixel too fine?
    computeHeightAbove() {
        let r = 0
        let e = this.anchorItem.index - this.rendered_start
        for (let i = 0; i < e; i++) {
            r += this.rendered_[i].height
        }
        this.heightAbove = r + this.anchorItem.offset
    }

    onScroll_() {
        // get the scroll from the window
        const top = this.scroller_.scrollTop
        let oldstart = this.rendered_start
        let oldindex = this.anchorItem.index
        let delta = top - this.anchorScrollTop

        console.log({
            top,
            oldstart,
            oldindex,
            delta,
        }, { ...this.anchorItem, top: this.scroller_.scrollTop, st: this.rendered_start, h: this.estHeight_ })

        this.anchorScrollTop = this.scroller_.scrollTop;
        if (this.scroller_.scrollTop == 0) {
            this.anchorItem = { index: 0, offset: 0 };
        } else {
            this.anchorItem = this.calculateAnchoredItem(this.anchorItem, delta)
        }

        const shift = this.rendered_start - oldstart
        if (shift == 0) return;


        let b, e
        if (Math.abs(shift) >= this.rendered_.length) {
            b = 0
            e = this.rendered_.length
        }
        else {
            // after shifting +, the last shift items are bad, after -  the first shift items are bad.        
            b = shift > 0 ? this.rendered_.length - shift : 0
            e = shift > 0 ? this.rendered_.length : - shift
            rotate(this.rendered_, shift)
        }
        const rendered_start = this.rendered_start
        for (let k = b; k < e; k++) {
            const o = this.rendered_[k];
            //o.data = this.snap_.get(rendered_start + k)
            this.builder(o.node, k, 0)
            this.measure(o)
            // maybe we should have both a tombstone and a div, then we can animate between them? this would keep things from jumping around? size transition as well opacity?
        }

        // if there is not enough room, we need to reset the scroll top to give enough room
        // if rendered start is 0, then we should also set the scroll top exactly.
        this.adjustHeight()
        let curPos = this.anchorScrollTop - this.heightAbove
        for (let i = 0; i < this.rendered_.length; i++) {
            const o = this.rendered_[i]
            if (o.top != curPos) {
                o.top = curPos
                this.position(o)
            }
            curPos += o.height
            // maybe we should have both a tombstone and a div, then we can animate between them? this would keep things from jumping around? size transition as well opacity?
        }
        this.computeHeightAbove() // this would be more efficient to do incrementally.

    }
}


// to make this an array of html strings with builder we need to communicate how the indexes change: rows get deleted and rows get inserted.

// we need a way to control multiple tables with the same scroller.
// we can put this on the user, and have an option to display scroll?
// should we force the scroll into a separate control altogether?

// we might want to position the scroll based on pixels or logical cells
// it might get even more complicated with the block editor?
// do we address by paragraph or by line?


// mayb this is wrapped by a more complex component that can handle multiple freeze/split areas.
// we should allow the client to estimate the size of an offscreen row, not necessarily just multiply by the height of the tombstone.


// it should be ok for the synchronous builder to itself push in a tombstone and then asynchronously format it? It will need to call GridUpdate to do so, since the row may change size. typically the cursor should on the visible screen and we endeavor to keep the top position of the focused cell the same. If the focused cell is off screen then we keep the first visible row fixed.

// when we move the rendered_start, we need to remember it's scrolltop
//renderToStaticMarkup?

/*

            // Remove all unused nodes
        while (this.unusedNodes.length) {
            let u = this.unusedNodes.pop()
            if (u)
                this.scroller_.removeChild(u);
        }


    // what is the implication of changing the height?
    // if alice "likes" something, we won't scroll every's screen because of anchors.
    // this should be like resize? just set everything to unrendered?
    // 
    invalidate(begin: number, end: number, data: Item[]) {
        // if this index is on screen then we need to render. otherwise 
        // there's nothing to do.
        //this.items_[i].data = data
        // we should only rerender this if its 
        // this.source_.render(data, this.items_[i].node)
        for (var i = 0; i < this.items_.length; i++) {
            this.items_[i].height = this.items_[i].width = 0;
        }
        this.onScroll_();
    }

    // loading not our job here, move to snapshot.
        let itemsNeeded = lastAttachedItem_ - this.loadedItems_;
        if (!this.requestInProgress_ && itemsNeeded > 0) {
            this.requestInProgress_ = true;
            const addContent = (items: Item[]) => {
                for (var i = 0; i < items.length; i++) {
                    if (this.items_.length <= this.loadedItems_) { }//this.addItem_(items[i]);
                    //this.items_[this.loadedItems_++].data = items[i];
                }
                this.attachContent();
            }
            // let mc = await this.source_.fetch(this.loadedItems_, this.loadedItems_ + itemsNeeded)
            //addContent(mc)
            this.requestInProgress_ = false;
        }
        
    export function dom(o: JSX.Element) {
    let d = document.createElement("div")
    createRoot(d).render(o)
    return d
}

interface ScrollState {
    //fixedHeight?: boolean
    data: Snapshot,
    anchor: number,
    offset: number
    selection: Set<number>

    delta: UpdateRange
}
interface UpdateRange {
    from: number
    to: number
    source: number
}
*/
/*
    //Attaches content to the scroller and updates the scroll position if necessary.
    render() {
        const x: RenderInfo = this.source_.data
        let unused = this.collectTombstones(x.unused)
        const o = this.source_.options
        const anchor = x.anchor - x.begin

        // maybe this returns items, unused. 
        // then we could loop through creating new elements as necessary
        // let [fdata, height, items, unused] = this.source_.data.data
        const getTombstone = () => {
            var tombstone = this.tombstones_.pop();
            if (tombstone) {
                tombstone.classList.remove('invisible');
                tombstone.style.opacity = "1";
                tombstone.style.transform = '';
                tombstone.style.transition = '';
                return tombstone;
            }
            return this.source_.createTombstone();
        }

        // render all the nodes. create an animation for each tombstone being replaced by data.
        var tombstoneAnimations = new Map<number, [HTMLElement, number]>()
        for (let i = 0; i < x.data.length; i++) {
            let nd = x.item[i].node
            let data = x.data[i]
            if (nd) {
                // if it's a tombstone but we have data, delete the tombstone.
                // if the data has changed, replace it.
                let replace = data && this.isTombstone(nd)
                if (replace) {
                    // TODO: Probably best to move items on top of tombstones and fade them in instead.
                    if (o.ANIMATION_DURATION_MS) {
                        nd.style.zIndex = "1";
                        tombstoneAnimations.set(i, [nd, x.item[i].top]) // - this.anchorScrollTo
                    } else {
                        nd.classList.add('invisible');
                        this.tombstones_.push(nd);
                    }
                    x.item[i].node = null;
                } else {
                    // here there was a node, but there is no data, so keep the tombstone.
                    continue;
                }
            }

            // if the data is valid, then render it. Otherwise render a tombstone.
            let d = x.data[i]
            if (d !== x.item[i].data) {
                var node = d ? this.source_.render(d, unused.pop()) : getTombstone();
                node.style.position = 'absolute';
                x.item[i].top = -1; // note that we don't need to set this prior to calling attach.
                this.scroller_.appendChild(node);
                x.item[i].node = node;
                x.item[i].data = d
                x.item[i].height = 0
            }
        }

        // Remove all unused nodes; why not make them invisible.
        while (unused.length) {
            let u = unused.pop()
            if (u)
                this.scroller_.removeChild(u);
        }

        // Get the height of all nodes which haven't been measured yet at once (no thrashing)
        let countMeasured = false
        for (let i = 0; i < x.data.length; i++) {
            let n = x.item[i].node
            // this checks that there is data, a node, and the height is currently 0
            // this will keep tombstones at 0 height, so we must check for that.
            if (n && x.item[i].data && !x.item[i].height) {
                x.item[i].height = n.offsetHeight;
                x.item[i].width = n.offsetWidth;
                countMeasured = true
            }
        }

        // so there is odd thing where subtracts the anchorScrollTop from top to create
        // tombstone animation, but then he recalculates anchorScrollTop and adds that back
        // to the animation top.
        // Fix scroll position in case we have realized the heights of elements
        // that we didn't used to know.
        // anchorScrollTop = sum(height of item) where item < anchor  + anchor.offset
        // note that this is all items - ugh!
        // what if they lose their size? what if we don't know their size?
        // what does this do on a resize? Maybe it doesn't matter because we 
        // are only measuring attachedContent?
        // we are setting anchorScrollTop to 0 here?

        // anchorScrollTop moves here because of the invisble things rendered above the anchor
        let anchorScrollTop = x.anchorTop + x.anchorOffset
        for (let i = 0; i < x.anchor; i++) {
            anchorScrollTop += x.item[i].height || x.tombstoneHeight
        }
        let deltaTop = anchorScrollTop - this.scroller_.scrollTop;

        // Set up initial positions for animations.
        for (let [i, anim] of tombstoneAnimations) {
            let n = x.item[i].node
            if (!n) continue

            // this need to subtract out the old anchorScollTop 
            const scale = (x.tombstoneWidth / x.item[i].width) + ', ' + (x.tombstoneHeight / x.item[i].height)
            const translateY = (deltaTop + anim[1])
            n.style.transform = 'translateY(' + translateY + 'px) scale(' + scale + ')';
            n.offsetTop  // Call offsetTop on the nodes to be animated to force them to apply current transforms.
            anim[0].offsetTop
            n.style.transition = 'transform ' + o.ANIMATION_DURATION_MS + 'ms';
        }

        // this animates all the items into position
        // Position all nodes. curPos with the position of the anchor item.
        // curPos should be
        let curPos = x.anchorTop
        // we need to subtract out the invisible items over the anchor.
        let i = x.anchor
        while (i > x.begin) {
            curPos -= x.item[i - 1].height || x.tombstoneHeight
            i--
        }

        for (let i = 0; i < x.data.length; i++) {
            const anim: undefined | [HTMLElement, number] = tombstoneAnimations.get(i)
            if (anim) {
                anim[0].style.transition = 'transform ' + o.ANIMATION_DURATION_MS + 'ms, opacity ' + o.ANIMATION_DURATION_MS + 'ms'
                anim[0].style.transform = 'translateY(' + curPos + 'px) scale(' + (x.item[i].width / x.tombstoneWidth) + ', ' + (x.item[i].height / x.tombstoneHeight) + ')'
                anim[0].style.opacity = "0"
            }
            let n = x.item[i].node
            if (n && curPos != x.item[i].top) {

                if (!anim)
                    n.style.transition = ''
                n.style.transform = 'translateY(' + curPos + 'px)'
            }
            x.item[i].top = curPos
            curPos += x.item[i].height || x.tombstoneHeight
        }

        if (o.ANIMATION_DURATION_MS) {
            // TODO: Should probably use transition end, but there are a lot of animations we could be listening to.
            setTimeout(() => {
                for (let [i, v] of tombstoneAnimations) {
                    var anim = tombstoneAnimations.get(i)
                    if (!anim) continue
                    anim[0].classList.add('invisible')
                    this.tombstones_.push(anim[0])
                    // Tombstone can be recycled now.
                }
            }, o.ANIMATION_DURATION_MS)
        }

        this.scrollRunway_.style.transform = 'translate(0, ' + x.runwayLength(curPos) + 'px)';
        this.scroller_.scrollTop = anchorScrollTop;
        x.anchorTop = anchorScrollTop
    }*/