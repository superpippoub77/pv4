class WaterMark extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `    <div id="watermark">
        VBProW4 by <a href="https://www.filippomorano.com" target="_blank" rel="noopener noreferrer">spikecode</a>
    </div>
        `;
    }
}

customElements.define("water-mark", WaterMark);
