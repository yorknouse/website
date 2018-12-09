$(document).ready(function () {

    "use strict"; // Start of use strict


    //back to top
    $('body').append('<div id="toTop" class="btn back-top"><span class="fa fa-angle-up"></span></div>');
    $(window).on('scroll',function () {
        if ($(this).scrollTop() !== 0) {
            $('#toTop').fadeIn();
        } else {
            $('#toTop').fadeOut();
        }
    });
    $('#toTop').on("click", function () {
        $("html, body").animate({scrollTop: 0}, 600);
        return false;
    });

    // IE10 viewport hack for Surface/desktop Windows 8 bug
    // See Getting Started docs for more information
    if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
        var msViewportStyle = document.createElement("style");
        msViewportStyle.appendChild(
                document.createTextNode(
                        "@-ms-viewport{width:auto!important}"
                        )
                );
        document.getElementsByTagName("head")[0].
                appendChild(msViewportStyle);
    }

    var $window = $(window);
    var $body = $(document.body);

    var navHeight = $('.navbar').outerHeight(true) + 10;

    $body.scrollspy({
        target: '.bs-sidebar',
        offset: navHeight
    });

    $window.on('load', function () {
        $body.scrollspy('refresh');
    });

    // back to top
    setTimeout(function () {
        var $sideBar = $('.bs-sidebar');

        $sideBar.affix({
            offset: {
                top: function () {
                    var offsetTop = $sideBar.offset().top;
                    var sideBarMargin = parseInt($sideBar.children(0).css('margin-top'), 33);
                    var navOuterHeight = $('.bs-docs-nav').height();

                    return (this.top = offsetTop - navOuterHeight - sideBarMargin);
                }
                , bottom: function () {
                    return (this.bottom = $('.bs-footer').outerHeight(true));
                }
            }
        });
    }, 100);


    // jQuery for page scrolling feature - requires jQuery Easing plugin
    $('a.page-scroll').bind('click', function (event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: ($($anchor.attr('href')).offset().top - 50)
        }, 1250, 'easeInOutExpo');
        event.preventDefault();
    });

    /* Demo purposes only */
    $(".hover").mouseleave(
            function () {
                $(this).removeClass("hover");
            }
    );

    $('body').scrollspy({
        target: '.bs-docs-sidebar',
        offset: 40
    });

});





