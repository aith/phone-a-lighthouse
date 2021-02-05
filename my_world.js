"use strict";

/* global XXH */
/* exported --
    p3_preload
    p3_setup
    p3_worldKeyChanged
    p3_tileWidth
    p3_tileHeight
    p3_tileClicked
    p3_drawBefore
    p3_drawTile
    p3_drawSelectedTile
    p3_drawAfter
*/

let tilesetImage;
function p3_preload() {
    tilesetImage = loadImage("assets/tilesheet_complete.png");  // from Kenney.nl
}

function p3_setup() { }

let worldSeed;

function p3_worldKeyChanged(key) {
    worldSeed = XXH.h32(key, 0);
    noiseSeed(worldSeed);
    randomSeed(worldSeed);
}

function p3_tileWidth() {
    return 32;
}
function p3_tileHeight() {
    return 16;
}

let [tw, th] = [p3_tileWidth(), p3_tileHeight()];

let clicks = {};
let rippleSources = [];
let tileSprites = {};

function p3_tileClicked(i, j) {
    let key = [i, j];
    clicks[key] = 1 + (clicks[key] | 0);  // increment clicks
    rippleSources.push([i,j, millis()]);
}

function p3_drawBefore() {
}

let hThresh = 0.01;
function p3_drawTile(i, j) {
    noStroke();

    let key = [i, j];
    if (!tileSprites[key]) {
        // let subtypeSeed = worldSeed + i + "," + j;  // TODO is this correct?
        let n = (noise(i, j) * 4) | 0;
        tileSprites[key] = n;
    }

    if (XXH.h32("tile:" + [i, j], worldSeed) % 4 == 0) {
        fill(240, 200);
    } else {
        fill(255, 200);
    }

    // TODO: how to make it s.t. ripples push down first
    function r(i, j) {
        let h = 0;
        for (let [ri, rj, t] of rippleSources) {
            let di = i - ri;
            let dj = j - rj;
            let r = sqrt(di*di+dj*dj) + 1;  // + 1 iot make tile with radius == 0 not be erased
            let timePassed = abs(t - millis());
            let easeIn =(abs(r - timePassed/16) + 1); // iot to make the force shift its peak over time
            let easeOut = (5000 - timePassed)/5000;  // should prolly clamp this
            h += ((sin(r+millis()/1000)/r*r) / sqrt(easeIn)) * easeOut;
            if (timePassed > 5000) rippleSources.shift();
        }
        return h * p3_tileWidth();
    }
    push();  // start new drawing state
    // beginShape();
    // vertex(-tw, 0 - r(i, j));  // defined in .p3_tileHeight
    // vertex(0, th - r(i, j));
    // vertex(tw, 0 - r(i, j));
    // vertex(0, -th - r(i, j));
    // endShape(CLOSE);
    // let a = random(4) | 0;
    placeTile(0, tileSprites[key], r(i, j));

    let c = clicks[[i, j]] | 0;
    if (c % 2 == 1) {
        fill(0, 0, 0, 32);
        ellipse(0, 0, 10, 5); // how does it know to create it at the tile? push(), and prolly the engine.js draw()
        translate(0, -10);
        fill(255, 255, 100, 128);
        ellipse(0, 0, 10, 10);  // shadow
    }

    pop();
}

function placeTile(ti, tj, hOff) {  // ti and tj determine tile used
  image(tilesetImage, 0, 0+hOff, 64, 64, ti * 110, tj * 128, 110, 128); // take offset from lookup(code)
}

function p3_drawSelectedTile(i, j) {
    noFill();
    stroke(0, 255, 0, 128);

    beginShape();
    vertex(-tw, 0);
    vertex(0, th);
    vertex(tw, 0);
    vertex(0, -th);
    endShape(CLOSE);

    noStroke();
    fill(0);
    text("tile " + [i, j], 0, 0);
}

function p3_drawAfter() {
}
