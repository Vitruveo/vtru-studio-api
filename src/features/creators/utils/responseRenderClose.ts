export const responseRenderClose = () => `
<!DOCTYPE html>
<html>
<head>
    <title>X Finished</title>
</head>
<body>
    <h4>Thank you for participating in the airdrop!</h4>
    <p>Close this window and return to the Vitruveo Airdrop page.</p>
    <script>
    function closeScreen() {
            window.opener=null; 
            window.close(); 
            return false;
    }
    closeScreen();
    </script>
</body>
</html>
`;
