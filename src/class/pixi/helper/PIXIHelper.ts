
import DestroyOptions = PIXI.DestroyOptions;
import { PIXISprite } from '../plugins/PIXISprite';
import Texture = PIXI.Texture;
import { PIXIDebug } from '../debugs/Debugs';

class PIXISpriteDebug extends PIXISprite {
    public __debugName:string;
    constructor(texture?:Texture) {
        super(texture);
    }
    destroy(options?: DestroyOptions | boolean) {
        if(PIXIDebug.console.destroy) {
            console.log(`[PIXISprite] destroy(${this.__debugName})`);
        }
        super.destroy(options);
    }
}

/** for memory profiling */
class PIXIContainer extends PIXI.Container {
    public __debugName:string;
    constructor() {
        super();
    }
    destroy(options?: DestroyOptions | boolean) {
        if(PIXIDebug.console.destroy) {
            console.log(`[PIXIContainer] destroy(${this.__debugName})`);
        }
        super.destroy(options);
    }
}



let PIXITempStore:any = require('../etc/PIXITempStore').PIXITempStore;
let PIXIText:any = require('../text/PIXIText').PIXIText;

export default class PIXIHelper {

    static sprite(debugName?:string, texture?:Texture):PIXI.Sprite {
        //return new PIXI.Sprite(texture);
        var c = new PIXISpriteDebug(texture);
        c.__debugName = debugName;
        return c;
    }

    static container(debugName?:string):PIXI.Container {
        // return new PIXI.Container();
        var c = new PIXIContainer();
        c.__debugName = debugName;
        return c;
    }

    static text(str:string, font:string, color:string, textBaseline:string, textAlign:string) {
        // console.log(str, font);
        var reg = /((\d+)(pt|sp|px))?\s*(.+)/gi;
        var result:any[] = reg.exec(font) || [];
        var fontName = (result[4]) || "NanumGothic";
        var size = (result[1]) || "10pt";

        // console.log({
        //     input: font,
        //     fontName: fontName,
        //     size: size
        // });

        // var t = new PIXI.Text(str, {
        var t = new PIXIText(str, {
            fontFamily: fontName,
            fontSize: size,
            fill: color,
            // textBaseline: textBaseline || 'alphabetic',
            textBaseline: "middle",
            align: textAlign || "left",
            miterLimit: 2.5 //createjs default value,
            ,padding: 5 //바운드를 삐져나오는 경우를 대비한 패딩
        });
        return t;
    }

    static getOffScreenCanvas(forceHTMLCanvas:boolean = false):HTMLCanvasElement {
        forceHTMLCanvas = true;
        var WIN:any = window;
        if( !forceHTMLCanvas && ("OffscreenCanvas" in WIN) ) {
            return new WIN.OffscreenCanvas(1,1);
        } else {
            return document.createElement('canvas');
        }
    }

    /**
     * createjs.Text.getMeasuredWidth() 의 pollyfill
     * @param pixiText
     */
    static textWidth(pixiText:any) {
        return pixiText.measuredWidth;
    }
    static textHeight(pixiText:any) {
        return pixiText.measuredHeight;
    }
    static getMeasuredLineHeight(pixiText:any) {
        return pixiText.measuredLineHeight;
    }

    /**
     * #ff00ff --> 0xff00ff
     * @param strColor
     */
    static colorToUint(strColor:any) {
        return strColor ? Number(strColor.replace("#", "0x")) : undefined;
    }

    static needDestroy(target:any) {

    }

    static todo(msg:string) {

    }

    static newPIXIGraphics() {
        return new PIXI.Graphics(false);
    }

    static randomRGBAString(alpha:number=0.3):string {
        var rr = this._rand255;
        return `rgba(${rr()},${rr()},${rr()},${alpha})`
    }

    private static _rand255():number {
        return Math.floor(Math.random()*255);
    }

    /**
     * createjs.DisplayObject#getTransformBound()
     * @param {PIXI.DisplayObject} target
     */
    static getTransformBound(target:any) {
        var bounds = target.getLocalBounds(PIXITempStore.rect);

        var x = bounds.x, y = bounds.y, width = bounds.width, height = bounds.height;
        var mtx = PIXITempStore.matrix1;
        target.localTransform.copy(mtx);

        if (x || y) {
            var mat2 = PIXITempStore.matrix2.identity().translate(-x,-y);
            mtx.append(mat2);
        }

        var x_a = width*mtx.a, x_b = width*mtx.b;
        var y_c = height*mtx.c, y_d = height*mtx.d;
        var tx = mtx.tx, ty = mtx.ty;

        var minX = tx, maxX = tx, minY = ty, maxY = ty;

        if ((x = x_a + tx) < minX) { minX = x; } else if (x > maxX) { maxX = x; }
        if ((x = x_a + y_c + tx) < minX) { minX = x; } else if (x > maxX) { maxX = x; }
        if ((x = y_c + tx) < minX) { minX = x; } else if (x > maxX) { maxX = x; }

        if ((y = x_b + ty) < minY) { minY = y; } else if (y > maxY) { maxY = y; }
        if ((y = x_b + y_d + ty) < minY) { minY = y; } else if (y > maxY) { maxY = y; }
        if ((y = y_d + ty) < minY) { minY = y; } else if (y > maxY) { maxY = y; }

        bounds.x = minX;
        bounds.y = minY;
        bounds.width = maxX-minX;
        bounds.height = maxY-minY;
        return bounds;
    }


    static HSVtoRGB(h:number, s:number, v:number):{r:number, g:number, b:number} {
        var r, g, b, i, f, p, q, t;
        // https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
        //https://ko.wikipedia.org/wiki/HSV_%EC%83%89_%EA%B3%B5%EA%B0%84
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }


}
