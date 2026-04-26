describe('ArcRenderer', function () {
    let engine;

    // Ensure ArcRenderer is initialized - async setup
    before(function (done) {
        if (window.ArcRenderer) {
            engine = window.ArcRenderer;
            done();
            return;
        }
        
        // Load the script asynchronously
        const script = document.createElement('script');
        script.src = '../scripts/arcRenderer.js';
        script.onload = function () {
            engine = window.ArcRenderer;
            done();
        };
        script.onerror = function () {
            done(new Error('Failed to load arcRenderer.js'));
        };
        document.head.appendChild(script);
    });

    describe('createArcShape', function () {
        it('should create an arc shape definition with correct properties', function () {
            const shape = engine.createArcShape(100, 50, "#FF0000");
            expect(shape.type).to.equal("arc");
            expect(shape.width).to.equal(100);
            expect(shape.height).to.equal(50);
            expect(shape.stroke.color).to.equal("#FF0000");
            expect(shape.fill).to.equal("none");
            expect(shape.startAngle).to.equal(0);
            expect(shape.endAngle).to.equal(180);
            expect(shape.arcTag).to.equal("onlydys-syllable-arc");
        });

        it('should use default color when none provided', function () {
            const shape = engine.createArcShape(100, 50);
            expect(shape.stroke.color).to.equal("#000000");
        });

        it('should calculate EMU conversion for stroke width correctly', function () {
            const shape = engine.createArcShape(10, 5, "#000");
            // 1.5pt = 1.5 * 12700 EMU
            expect(shape.stroke.width).to.equal(1.5 * 12700);
        });

        it('should create arc with different dimensions', function () {
            const shape1 = engine.createArcShape(50, 25, "#00FF00");
            expect(shape1.width).to.equal(50);
            expect(shape1.height).to.equal(25);
            expect(shape1.stroke.color).to.equal("#00FF00");

            const shape2 = engine.createArcShape(200, 100, "#0000FF");
            expect(shape2.width).to.equal(200);
            expect(shape2.height).to.equal(100);
            expect(shape2.stroke.color).to.equal("#0000FF");
        });
    });

    describe('hexToOnlyOfficeColor', function () {
        it('should convert full hex color to RGB object', function () {
            const color = engine.hexToOnlyOfficeColor("#FF0000");
            expect(color.R).to.equal(255);
            expect(color.G).to.equal(0);
            expect(color.B).to.equal(0);
        });

        it('should convert hex color without # prefix', function () {
            const color = engine.hexToOnlyOfficeColor("FF0000");
            expect(color.R).to.equal(255);
            expect(color.G).to.equal(0);
            expect(color.B).to.equal(0);
        });

        it('should convert shorthand hex color', function () {
            const color = engine.hexToOnlyOfficeColor("#0F0");
            expect(color.R).to.equal(0);
            expect(color.G).to.equal(255);
            expect(color.B).to.equal(0);
        });

        it('should convert blue color', function () {
            const color = engine.hexToOnlyOfficeColor("0047AB");
            expect(color.R).to.equal(0);
            expect(color.G).to.equal(71);
            expect(color.B).to.equal(171);
        });

        it('should handle empty string', function () {
            const color = engine.hexToOnlyOfficeColor("");
            expect(color.R).to.be.NaN;
            expect(color.G).to.be.NaN;
            expect(color.B).to.be.NaN;
        });
    });

    describe('renderArcPreviewHTML', function () {
        it('should render text with syllable arcs', function () {
            const html = engine.renderArcPreviewHTML(
                "maison",
                ["mai", "son"],
                ["#FF0000", "#0000FF"]
            );
            expect(html).to.include("mai");
            expect(html).to.include("son");
            expect(html).to.include("border-bottom: 2px solid #FF0000");
            expect(html).to.include("border-bottom: 2px solid #0000FF");
        });

        it('should render text with single word and single syllable', function () {
            const html = engine.renderArcPreviewHTML("a", ["a"], ["#FF0000"]);
            expect(html).to.include("a");
            expect(html).to.include("border-bottom: 2px solid #FF0000");
        });

        it('should handle empty syllables array', function () {
            const html = engine.renderArcPreviewHTML("test", [], ["#FF0000"]);
            expect(html).to.equal("<span>test</span>");
        });

        it('should handle empty text', function () {
            const html = engine.renderArcPreviewHTML("", ["a"], ["#FF0000"]);
            expect(html).to.equal("");
        });

        it('should handle word with no matching syllables', function () {
            const html = engine.renderArcPreviewHTML(
                "hello",
                ["world"],
                ["#FF0000"]
            );
            expect(html).to.equal("<span>hello</span>");
        });

        it('should handle partial syllable matches', function () {
            const html = engine.renderArcPreviewHTML(
                "hello world",
                ["hell", "o", "wor", "ld"],
                ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"]
            );
            expect(html).to.include("hell");
            expect(html).to.include("o");
            expect(html).to.include("wor");
            expect(html).to.include("ld");
        });

        it('should escape HTML special characters', function () {
            const html = engine.renderArcPreviewHTML(
                "<test>&\"'",
                ["<test"],
                ["#FF0000"]
            );
            expect(html).to.include("&lt;test");
            expect(html).to.include("&amp;&quot;&#039;");
            expect(html).to.include("border-bottom: 2px solid #FF0000");
        });
    });

    describe('createTextRunsWithArcs', function () {
        it('should create text runs with arc formatting', function () {
            const runs = engine.createTextRunsWithArcs(
                "maison",
                ["mai", "son"],
                ["#FF0000", "#0000FF"]
            );
            expect(runs).to.have.lengthOf(2);
            expect(runs[0].text).to.equal("mai");
            expect(runs[0].formatting.hasArc).to.be.true;
            expect(runs[0].formatting.arcColor).to.equal("#FF0000");
            expect(runs[1].text).to.equal("son");
            expect(runs[1].formatting.hasArc).to.be.true;
            expect(runs[1].formatting.arcColor).to.equal("#0000FF");
        });

        it('should handle empty syllables array', function () {
            const runs = engine.createTextRunsWithArcs("test", [], ["#FF0000"]);
            expect(runs).to.have.lengthOf(1);
            expect(runs[0].text).to.equal("test");
            expect(runs[0].formatting.hasArc).to.be.undefined;
        });

        it('should handle text with non-matching syllables', function () {
            const runs = engine.createTextRunsWithArcs(
                "hello",
                ["world"],
                ["#FF0000"]
            );
            expect(runs).to.have.lengthOf(1);
            expect(runs[0].text).to.equal("hello");
        });

        it('should use default palette when none provided', function () {
            const runs = engine.createTextRunsWithArcs("test", ["tes", "t"], []);
            expect(runs[0].formatting.arcColor).to.equal("#D62728");
            expect(runs[1].formatting.arcColor).to.equal("#2B83BA");
        });

        it('should handle word with multiple syllables', function () {
            const runs = engine.createTextRunsWithArcs(
                "impossible",
                ["im", "pos", "si", "ble"],
                ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"]
            );
            expect(runs).to.have.lengthOf(4);
            expect(runs[0].text).to.equal("im");
            expect(runs[1].text).to.equal("pos");
            expect(runs[2].text).to.equal("si");
            expect(runs[3].text).to.equal("ble");
        });
    });

    describe('escapeHtml', function () {
        it('should escape & character', function () {
            expect(engine.escapeHtml("a&b")).to.equal("a&amp;b");
        });

        it('should escape < and > characters', function () {
            expect(engine.escapeHtml("<test>")).to.equal("&lt;test&gt;");
        });

        it('should escape quotes', function () {
            expect(engine.escapeHtml('"test"')).to.equal("&quot;test&quot;");
            expect(engine.escapeHtml("it's")).to.equal("it&#039;s");
        });

        it('should handle empty string', function () {
            expect(engine.escapeHtml("")).to.equal("");
        });

        it('should handle null and undefined', function () {
            expect(engine.escapeHtml(null)).to.equal("");
            expect(engine.escapeHtml(undefined)).to.equal("");
        });
    });

    describe('createPreviewModel', function () {
        it('should create a model with arc indicators', function () {
            const model = engine.createPreviewModel(
                "test",
                'syllables',
                ["#FF0000", "#0000FF"]
            );
            expect(model).to.have.property('paragraphs');
            expect(model.paragraphs).to.have.lengthOf(1);
            expect(model.paragraphs[0]).to.have.property('textRuns');
            expect(model.syllables).to.be.an('array');
        });

        it('should use default palette when none provided', function () {
            const model = engine.createPreviewModel("test", 'syllables');
            // Should still create a valid model
            expect(model.paragraphs).to.have.lengthOf(1);
        });
    });
});
