describe('ArcRenderer', function () {
    const engine = window.ArcRenderer;

    it('should create an arc shape definition with correct properties', function () {
        const shape = engine.createArcShape(100, 50, "#FF0000");
        expect(shape.type).to.equal("arc");
        expect(shape.width).to.equal(100);
        expect(shape.height).to.equal(50);
        expect(shape.stroke.color).to.equal("#FF0000");
        expect(shape.fill).to.equal("none");
    });

    it('should calculate EMU conversion for stroke width correctly', function () {
        const shape = engine.createArcShape(10, 5, "#000");
        // 1pt = 12700 EMU
        expect(shape.stroke.width).to.equal(12700);
    });
});
