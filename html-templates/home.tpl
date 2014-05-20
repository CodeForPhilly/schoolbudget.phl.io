<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>School District of Philadelphia: Budget Data Visualizer</title>
        {cssmin "sunburst.css"}
        <meta property="og:title" content="School District of Philadelphia: Budget Data Visualizer"/>
        <meta property="og:url" content="http://sdp-budget.poplar.phl.io/sunburst"/>
        <meta property="og:site_name" content="Code for Philly"/>
        <meta property="og:image" content="http://sdp-budget.poplar.phl.io/sdp_budget_visualizer.png" />
        <link rel="image_src" href="http://sdp-budget.poplar.phl.io/sdp_budget_visualizer.png">
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
            <div id="share-buttons">
                <!-- Facebook -->
                <a href="http://www.facebook.com/sharer.php?u=http://schoolbudget.phl.io/" target="_blank"><img src="http://www.simplesharebuttons.com/images/somacro/facebook.png" alt="Facebook" /></a>
                 
                <!-- Twitter -->
                <a href="http://twitter.com/share?url=http://schoolbudget.phl.io/&text=School District of Philadelphia Budget Visualization" target="_blank"><img src="http://www.simplesharebuttons.com/images/somacro/twitter.png" alt="Twitter" /></a>
                 
                <!-- Google+ -->
                <a href="https://plus.google.com/share?url=http://schoolbudget.phl.io/" target="_blank"><img src="http://www.simplesharebuttons.com/images/somacro/google.png" alt="Google" /></a>
                 
                <!-- Reddit -->
                <a href="http://reddit.com/submit?url=http://schoolbudget.phl.io/&title=School District of Philadelphia Budget Visualization" target="_blank"><img src="http://www.simplesharebuttons.com/images/somacro/reddit.png" alt="Reddit" /></a>
                 
                <!-- LinkedIn -->
                <a href="http://www.linkedin.com/shareArticle?mini=true&url=http://schoolbudget.phl.io/" target="_blank"><img src="http://www.simplesharebuttons.com/images/somacro/linkedin.png" alt="LinkedIn" /></a>
                 
                <!-- Email -->
                <a href="mailto:?Subject=School District Budget&Body=School%20District%20Budget%20Visualization%20 http://schoolbudget.phl.io/"><img src="http://www.simplesharebuttons.com/images/somacro/email.png" alt="Email" /></a>
            </div>
            <form>
                <div>
                    <span class="year-label">Estimated <span id="yearCurrent"></span> budget:</span>
                    <label><input type="radio" name="fund" value="current.total" checked> Total    </label>
                    <label><input type="radio" name="fund" value="current.operating"> Operating    </label>
                    <label><input type="radio" name="fund" value="current.grant"> Grant    </label>
                    <label><input type="radio" name="fund" value="current.capital"> Capital    </label>
                    <label><input type="radio" name="fund" value="current.other"> Other</label>
                </div>   
                <div>    
                    <span class="year-label">Proposed <span id="yearNext"></span> budget:</span>
                    <label><input type="radio" name="fund" value="next.total"> Total    </label>
                    <label><input type="radio" name="fund" value="next.operating"> Operating    </label>
                    <label><input type="radio" name="fund" value="next.grant"> Grant    </label>
                    <label><input type="radio" name="fund" value="next.capital"> Capital    </label>
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
                <p>Created by <a href="https://twitter.com/themightychris" target="_blank">Chris Alfano</a> & <a href="https://twitter.com/laurenancona" target="_blank">Lauren Ancona</a> | a <a href="http://codeforphilly.org/projects/sdp_online_budget_visualization" target="_blank">Code for Philly</a> project</p>
            </div>
        </div>
        <div id="sidebar">
            
            <ul id="legend"></ul>
            <p class="note">Note: Undistributed budgetary adjustments and gap closing reductions are distributed for the purposes of this chart. <br><br> Source: <a href="http://webgui.phila.k12.pa.us/offices/o/open-data-initiative">SDP Open Data Initiative</a></p>
        </div>
        <script src="{Site::getVersionedRootUrl('js/d3.min.js')}"></script>
        {jsmin "sunburst.js"}
        
    </body>
</html>