{ pkgs, ... }: {
  channel = "stable-25.05"; 
  packages = [
    pkgs.nodejs_24
  ];
  env = {};
  idx = {
    extensions = [
    
 "esbenp.prettier-vscode"
 "PKief.material-icon-theme"
 "redhat.vscode-yaml"];
    workspace = {
      onCreate = {
        npm-install = "npm ci --no-audit --prefer-offline --no-progress --timing";
      };
      onStart= {
        run-server = "npm run dev";
      };
    };
  };
}