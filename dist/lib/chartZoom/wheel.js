import { DIRECTION, dirOptions } from "./options";
import { EventDispatcher } from '../utils';
import { scaleK } from './utils';
export class ChartZoomWheel {
    constructor(el, options) {
        this.el = el;
        this.options = options;
        this.scaleUpdated = new EventDispatcher();
        el.addEventListener('wheel', ev => this.onWheel(ev));
    }
    onWheel(event) {
        event.preventDefault();
        let deltaX = event.deltaX;
        let deltaY = event.deltaY;
        switch (event.deltaMode) {
            case 1: // line
                deltaX *= 30;
                deltaY *= 30;
                break;
            case 2: // page
                deltaX *= 400;
                deltaY *= 400;
                break;
        }
        const transform = {
            [DIRECTION.X]: {
                translate: 0,
                zoom: 0,
            },
            [DIRECTION.Y]: {
                translate: 0,
                zoom: 0,
            }
        };
        if (event.ctrlKey) { // zoom
            if (event.altKey) {
                transform[DIRECTION.X].zoom = deltaX;
                transform[DIRECTION.Y].zoom = deltaY;
            }
            else {
                transform[DIRECTION.X].zoom = (deltaX + deltaY);
            }
        }
        else { // translate
            if (event.altKey) {
                transform[DIRECTION.X].translate = deltaX;
                transform[DIRECTION.Y].translate = deltaY;
            }
            else {
                transform[DIRECTION.X].translate = (deltaX + deltaY);
            }
        }
        const boundingRect = this.el.getBoundingClientRect();
        const origin = {
            [DIRECTION.X]: event.clientX - boundingRect.left,
            [DIRECTION.Y]: event.clientY - boundingRect.right,
        };
        for (const { dir, op } of dirOptions(this.options)) {
            const domain = op.scale.domain();
            const k = scaleK(op.scale);
            const trans = transform[dir];
            const transOrigin = op.scale.invert(origin[dir]);
            trans.translate *= k;
            trans.zoom *= 0.003;
            const newDomain = domain.map(d => d + trans.translate + (d - transOrigin) * trans.zoom);
            op.scale.domain(newDomain);
        }
        this.scaleUpdated.dispatch();
    }
}
//# sourceMappingURL=wheel.js.map