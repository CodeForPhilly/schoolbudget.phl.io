<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        {cssmin "sunburst.css"}
        <meta property="og:title" content="Philadelphia School District: Budget Data Visualizer"/>
        <meta property="og:url" content="http://sdp-budget.poplar.phl.io/sunburst"/>
        <meta property="og:site_name" content="Code for Philly"/>
        <meta property="og:image"content="http://sdp-budget.poplar.phl.io/sdp_budget_visualizer.png" />
        <meta property="og:description"content="A web-based visualization of the budget information released on the School District of Philadelphia's Open Data Initiative page." />
        <script src="//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js"></script>
        <script>
          WebFont.load({
            google: {
              families: ['Fjalla One', 'Merriweather']
            }
          });
        </script>
    </head>
    <body>
        {literal}
        <!-- Google Tag Manager -->
            <noscript><iframe src="//www.googletagmanager.com/ns.html?id=GTM-K4G748"
            height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
            <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            '//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-K4G748');</script>
        <!-- End Google Tag Manager -->
        {/literal}
        <header id="budget-header" style="visibility: hidden">
            <h1 id="headline"></h1>
            <form>
                <div>
                    <span class="year-label">Estimated <span id="yearCurrent"></span> budget:</span>
                    <label><input type="radio" name="fund" value="current.total" checked>  Total</label>
                    <label><input type="radio" name="fund" value="current.operating">  Operating</label>
                    <label><input type="radio" name="fund" value="current.grant">  Grant</label>
                    <label><input type="radio" name="fund" value="current.capital">  Capital</label>
                    <label><input type="radio" name="fund" value="current.other">  Other</label>
                </div>
                <div>
                    <span class="year-label">Proposed <span id="yearNext"></span> budget:</span>
                    <label><input type="radio" name="fund" value="next.total"> Total</label>
                    <label><input type="radio" name="fund" value="next.operating"> Operating</label>
                    <label><input type="radio" name="fund" value="next.grant"> Grant</label>
                    <label><input type="radio" name="fund" value="next.capital"> Capital</label>
                    <label><input type="radio" name="fund" value="next.other"> Other</label>
                </div>
            </form>
        </header>

        <div id="main">
            <div id="sequence"><ul class="crumbs"></ul><span class="total"></span></div>
            <div id="chart">
                <div id="explanation" style="visibility: hidden;">
                    <div id="percentage"></div>
                    <div id="total"></div>
                    <div id="category"></div>
                </div>
            </div>
            <div id="credits">
                <p><em>Note: Undistributed budgetary adjustments and gap closing reductions are distributed for the purposes of this chart.</em></p>
                <p>Created by Chris Alfano & Lauren Ancona | a <a href="http://codeforphilly.org/projects/sdp_online_budget_visualization">Code for Philly project</a></p>
            </div>
        </div>
        <div id="sidebar">
            <ul id="legend"></ul>
        </div>
        <script src="{Site::getVersionedRootUrl('js/d3.min.js')}"></script>
        {jsmin "sunburst.js"}
        
    </body>
</html>