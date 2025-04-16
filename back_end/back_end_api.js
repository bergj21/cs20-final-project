
function get_user_session_status(req, res) 
{
    if (req.session.user_id) {
        res.json({ loggedIn: true, userId: req.session.user_id });
    } else {
        res.json({ loggedIn: false });
    }
}

module.exports = { get_user_session_status };