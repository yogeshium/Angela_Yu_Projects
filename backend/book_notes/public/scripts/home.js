console.log($("#filter-by"));
console.log($("#filter-by").next());
$("#filter-by").change(function(){
    $("#filter-by").next().click();
});