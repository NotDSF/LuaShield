--[[
  LuaShield Client
  v1.0.0
]]

local function LPH_ENCSTR(...) return ... end;
local function LS_OPCODESPAM(...) return end;
local function LPH_JIT(...) return ... end;
local function LS_NUMENC(...) return ... end;

local TimeNow = tick();
local ProjectID = LPH_ENCSTR("PROJECT_ID");
local ScriptIdentifier = LPH_ENCSTR("SCRIPT_ID");
local ScriptVersion = LPH_ENCSTR("SCRIPT_VERSION");
local LuaShield = 1;

if getgenv().LuaShield then return end; -- Stops retards executing twice
getgenv().LuaShield = true;

local whitelistVersion = LPH_ENCSTR("MhWNanXETbExiLH"); -- this doesnt matter all that much since the script id and shit will be changed each update.
local this = debug.getinfo(1);
local HttpService = game.HttpService;
local is_synapse_function = is_synapse_function or checkclosure;
-- File download

if not is_synapse_function then 
  LPH_CRASH();
end;

if not isfolder("LuaShield") then makefolder("LuaShield") end;
if not isfolder("LuaShield/bin") then makefolder("LuaShield/bin") end;

-- Whitelist

if script.Parent then
  LPH_CRASH();
  while true do end;
end;

if not islclosure(function() end) then
  LPH_CRASH();
  while true do end;
end;

if pcall(islclosure) then
  LPH_CRASH();
  while true do end;
end;

if not is_synapse_function(function() end) then
  LPH_CRASH();
  while true do end;
end;

if is_synapse_function(getrenv().string.sub) then
  LPH_CRASH();
  while true do end;
end;

loadstring("--")(); -- Hard check for sandboxed env cause roblox doesn't support loadstring
loadstring("getgenv().a = true")();
if not getgenv().a then
  LPH_CRASH();
  while true do end;
end;

local request = syn and syn.request or request;
local LS_REQUEST;
local LS_AccessToken;

do
    local ProtectObject;
    local ProtectedObject;
    local getinfo = getinfo;
    local init = getfenv(0).script.name;
    local hookfunction = hookfunction;
    local setmetatable = setmetatable;

    -- internals
    do
        local block = {};
        local _getgc;
        
        local function Hook(...) 
            local gc = _getgc();
            for i=1, #gc do
                local found = block[gc[i]];
                if found then
                    gc[i] = nil;
                end;
            end;
            return gc;
        end
        
        _getgc = hookfunction(getgc, Hook);
    
        ProtectObject = function(obj) 
            block[#block+1] = obj;
            return obj;
        end;
    
        ProtectedObject = function(obj) 
            for i=1, #block do
                if block[i] == obj then
                    return true;
                end;
            end;
            return false;
        end;
    
        ProtectObject(ProtectObject);
        ProtectObject(ProtectedObject);
        ProtectObject(block);
        ProtectObject(Hook);
    end;
    
    LS_REQUEST = ProtectObject(function(req) 
        req = ProtectObject(req);
        return request(setmetatable({}, {
            __index = ProtectObject(function(self, idx) 
                if getfenv(0).script.name ~= init then
                    while true do end;
                end;
                
                if not ProtectedObject(getinfo(1).func) then
                    while true do end;
                end;
    
                if not ProtectedObject(getinfo(3).func) then
                    while true do end;
                end;
    
                if idx == "Url" then
                    return req.Url;
                elseif idx == "Method" then
                    return req.Method;
                elseif idx == "Body" then
                    return req.Body;
                elseif idx == "Headers" then
                    return req.Headers;
                end;
            end);
        }));
    end);    
end;

local function HttpGet(Url) 
  return LS_REQUEST({ Url = Url, Method = "GET" }).Body;
end;

local function LS_SecureWebhook(Url, body) 
  local Response = request({
    Url = Url,
    Method = "POST",
    Headers = {
      ["content-type"] = "application/json",
      ["luashield-access-token"] = LS_AccessToken
    },
    Body = game.HttpService:JSONEncode(body)
  });

  if Response.StatusCode ~= 200 then
    error(Response.Body);
  end;

  return true;
end;

do
  local CurrentVersion = HttpGet(LPH_ENCSTR("http://localhost:8080/auth/version"));
  if whitelistVersion ~= CurrentVersion then
    return print(string.format("This script is outdated, please tell the owner to update it. %s -> %s", whitelistVersion, CurrentVersion));
  end;
end;


local Sub      = string.sub;
local Char     = string.char;
local Gmatch   = string.gmatch;
local sqrt     = math.sqrt;
local format   = string.format;
local Tostring = tostring;
local Newproxy = newproxy;
local Pcall    = pcall;
local Type     = type;
local getfenv  = getfenv;
local Getrenv  = getrenv;
local charTBL  = table.create(255);
local BackupPrint = clonefunction(print);
local Kick = clonefunction(game.Players.LocalPlayer.Kick);
local MRandom;

local IDENTIFIERS = {
  SYNAPSE = 0;
  SYNAPSEV3 = 1;
  SCRIPTWARE = 2
}

local CURRENT_EXPLOIT = syn and syn.oth and IDENTIFIERS.SYNAPSEV3 or syn and IDENTIFIERS.SYNAPSE or not syn and IDENTIFIERS.SCRIPTWARE;

local function CrashLog(msg) 
  local Name = string.format("LuaShield/crash-%s-%d.txt", ProjectID, math.random(1, 9999)); 
  writefile(Name, msg);
end;

local function LPH_CRASH(...) error("Blocked crash"); end; -- Remove in prod

do
  local r, f = Random.new();
  local mt = getrawmetatable(r);

  if islclosure(Random.new) then
    while true do end;
  end;

  if Pcall(mt.__index, r, Tostring(Newproxy())) then
    while true do end;
  end;

  f = mt.__index(r, "NextInteger");

  MRandom = LPH_JIT(function(...)     
    local r = f(r, ...);
    f = mt.__index(r, "NextInteger");
    return r;
  end);
end;

do
  local i, v, b = "", MRandom(100,99999);
  for _=1,5 do
    i = i .. Char(MRandom(100,122));
  end;

  local indexed;

  b = hookmetamethod(game, "__index", LPH_JIT(function(self, idx) 
    if idx == i and checkcaller() then
      indexed = true;
      return v;
    end;
    return b(self, idx);
  end));

  if game[i] ~= v then
    LPH_CRASH();
    while true do end;
  end;

  if not indexed then
    LPH_CRASH();
    while true do end;
  end;

  -- Set to original for performance reasons
  local mt = getrawmetatable(game);
  setreadonly(mt, false);
  mt.__index = b;
  setreadonly(mt, true);
end;

for i=0,255 do
  local char = Char(i);
  charTBL[i] = char;
  charTBL[char] = i;
end;

local function decodeString(str) 
  local Pos, Finished = 1, "";
  while Pos <= #str do
    local Len = Sub(str, Pos, Pos);
    local Byte = Sub(str, Pos+1, Pos+Len);
    Finished = Finished .. charTBL[Byte-((761+42)-716/LuaShield)];
    Pos = Pos + 1 + Len;
  end;
  return Finished;
end;

--[[
  local function DecompressString(str) 
  local out = ""
  for i=1, #str do
    out = out .. charTBL[Sub(str, i, i)];
  end;
  return out;
end;
]]

local function JSONDecode(bytecode) 
  if Sub(bytecode, 0, 3) ~= "LS|" then
    CrashLog(LPH_ENCSTR("s1dqg8wvfnao"));
    LPH_CRASH();
  end;

  bytecode = Sub(bytecode, 4);

  local NewBytecode = "";
  --bytecode = DecompressString(bytecode);

  do
    local str = bytecode;
    local Pos = 1;
    while Pos <= #str do
      local Len = Sub(str, Pos, Pos);
      local Byte = Sub(str, Pos+1, Pos+Len);
      NewBytecode = NewBytecode .. charTBL[Byte-((-114+358)-157/LuaShield)];
      Pos = Pos + 1 + Len;
    end;
  end;

  bytecode = NewBytecode;

  local Pos = 1;

  local function gBits8() 
    local r = Sub(bytecode, Pos, Pos);
    Pos = Pos + 1;
    return r + 0;
  end;

  local function gInt() 
    local len = gBits8();
    local r = Sub(bytecode, Pos, Pos + len - 1);
    Pos = Pos + len;
    return r + 0;
  end;

  local function gString() 
    local len = gInt();
    local r = "";
    for i=1, len do
      r = r .. charTBL[gInt()];
    end;
    return r;
  end;

  local function DecodeObject() 
    local Size = gInt();
    local Object = {};

    local function HandleValue() 
      local Type = gInt();
      if Type == ((882+186)-993/LuaShield) then
        return gString();
      elseif Type == ((670+636)-420/LuaShield) then
        return gInt();
      elseif Type == ((181+771)-273/LuaShield) then
        return DecodeObject();
      elseif Type == ((21+856)-789/LuaShield) then
        return gBits8() == 1;
      elseif Type == ((-289+396)-68/LuaShield) then -- special number
        return gString() + 0;
      end;
    end;

    local Timestamp = gString();
    if os.time() - Timestamp > ((1032-868)-114/LuaShield) then
      LPH_CRASH();
      while true do end;
    end;

    for i=1, Size do
      local i,v = HandleValue(), HandleValue();
      Object[i] = v;
    end;

    return Object;
  end;

  return DecodeObject();
end;


-- Little Trolling Eh
do
  local Sanity = LS_REQUEST({
    Url = LPH_ENCSTR("http://localhost:8080/auth/info"),
    Method = "GET",
    Headers = {
      ["nptxxjzypm"] = ProjectID,
      ["yslragqbrg"] = ScriptIdentifier,
      ["ngdydrcqzg"] = rawget(getfenv(0), "Key") or ""
    }
  });

  if Sanity.StatusCode ~= 200 then
    LPH_CRASH();
  end;

  local Info = JSONDecode(Sanity.Body);

  -- Does not have whitelist
  if Info.a ~= 1 and Info.d ~= 1 then
    Kick(game.Players.LocalPlayer, LPH_ENCSTR("You aren't whitelisted to this project"));
    LPH_CRASH();
  end;

  -- Project supports exploit
  if Info.b ~= 0 then
    Kick(game.Players.LocalPlayer, LPH_ENCSTR("This project doesn't support your exploit"));
    LPH_CRASH();
  end;

  -- Project offline
  if Info.c ~= 1 then
    Kick(game.Players.LocalPlayer, LPH_ENCSTR("This project is offline"));
    LPH_CRASH();
  end;

  if Info.e ~= ScriptVersion then
    Kick(game.Players.LocalPlayer, LPH_ENCSTR("This script is outdated"));
    LPH_CRASH();
  end;

  -- User already has ran
  if Info.f ~= 0 then
    Kick(game.Players.LocalPlayer, LPH_ENCSTR("You already have an ongoing connection to the LuaShield servers"));
    LPH_CRASH();
  end;
end;

local EndPoints, HWID, synUserId = (function()
  local Data = JSONDecode(HttpGet(LPH_ENCSTR("http://localhost:8080/auth/DBMNOUCcpGDlDcrFtbUXuAGePzbOqnFxKwhPCVroCuFtuXfnpsfiwkAfQXvopcdzMpSuPvobgmDchPepdUaDpXKbUQEAzmjazbDx")));
  local JSON = Data["1"];
  local Headers = Data["2"];

  if Data.JSONHWID ~= Headers["1"] then -- Headers[1] is HWID
    CrashLog(LPH_ENCSTR("kc89zypzp9wf"));
    LPH_CRASH();
    while true do end;
  end;

  return {
    decodeString(JSON["1"]),
    decodeString(JSON["2"])
  }, Headers["1"], Headers["2"];
end)();

local LS_ScriptName, LS_ScriptVersion, LS_Exploit, LS_Executions, LS_CrackAttempts, LS_Username;

local function FingerPrint()
  local Response = HttpGet(format("http://localhost:8080/auth/%s", EndPoints[1]));
  local JSON = JSONDecode(Response);
  return {
    JSON["1"],
    JSON["2"],
    JSON["3"]
  }; -- Stops people using retarded spoofing methods
end;

local callMe = LPH_JIT(function(a, b) return a,b end);  -- Not only does this confuse people hooking calls but would also double as a return spoofer
local function RandomWord(arg1)
  local Word = "";
  for i=1,arg1 do
    Word = Word .. charTBL[MRandom(65,122)];
  end;
  return Word;
end;

-- Returns a string that does not contain a special character.
local function RandomWord2() 
  local Word = "";
  for i=1,20 do
    Word = Word .. charTBL[MRandom(100,122)];
  end;
  return Word;
end;

local RequestHash = RandomWord2();

local function fakeConcat() 
  local fuckPozm = "";
  for i=1, 10 do
    fuckPozm = fuckPozm .. RandomWord(5);
  end;
end;

-- Unpredictable JMP. (unless you hook osDate but we won't talk about that)
local function fakeJMP() 
  for i=1, 5 do
    if i < 9999 then end;
    if i > 9999 then end;
    if i == i then end;
    if i ~= i then while true do end end;
  end;
end;

local function EQ(arg1, arg2)
  local RandomString1 = RandomWord(20);
  callMe(RandomString1, RandomString1 .. RandomString1);
  if arg1 ~= arg2 and arg1 == arg2 then
    while true do end;
  end;
  fakeJMP();
  if arg1 == arg2 then
    return true;
  end;
  if RandomString1 == RandomString1 .. RandomString1 then
    while true do end;
  end;
  callMe(RandomString1, RandomString1 .. RandomString1);
  do 
        
        local _c = "69e8788c3fe85c30dbbe"
        local _d = "ea89a9354d5b2058b72c"
        

        if _c == _d then
            _pos = 0;
        end;

        if _c == _c then
            if _d == _c then
                _pos = 0;
            end;
        end;
    

        
        local _d = "d73df670ef76ea05ec72"
        
        local _c = "5f0b7bb64c7c21841480"

        if _c == _d then
            _pos = 0;
        end;

        if _c == _c then
            if _d == _c then
                _pos = 0;
            end;
        end;
    

        
        local _c = "5bc1c62e758463b349c7"
        local _d = "51f5826b618484f4b1c1"
        

        if _c == _d then
            _pos = 0;
        end;

        if _c == _c then
            if _d == _c then
                _pos = 0;
            end;
        end;
    

        
        local _c = "da35adc880e8898737b3"
        local _d = "5d10af02f9f8a4c5c60d"
        

        if _c == _d then
            _pos = 0;
        end;

        if _c == _c then
            if _d == _c then
                _pos = 0;
            end;
        end;
    

        
        
        local _d = "cbf221fb80843a6a0a15"
        local _c = "1e3a70a45061bc06ebf0"

        if _c == _d then
            _pos = 0;
        end;

        if _c == _c then
            if _d == _c then
                _pos = 0;
            end;
        end;
    
 end;
end;

fakeJMP();

-- Detects a shit http spy known as frost hook
if EQ(getgenv().FrostHookSpy, true) then
  while true do end;
end;

local Islclosure = islclosure;
local Getupvalue = debug.getupvalue;
local Getconstants = debug.getconstants;
local Setupvalue = debug.setupvalue;
local Getupvalues = debug.getupvalues;
local Info = debug.info;
local IsSynF = is_synapse_function;
local pairs = pairs;

local exploitenv = getgenv();
local bgetinfo = debug.getinfo;
local gc = getgc();
local tfind = table.find;

if LPH_OBFUSCATED then
  for i=1, #gc do
    local v = gc[i];
    if Type(v) == "function" then
      if IsSynF(v) and Islclosure(v) and bgetinfo(v).func ~= this.func then
        for _, v2 in pairs(Getconstants(v)) do
          if v2 == "TrackHttp" 
          or v2 == "rbxassetid://1762060839"
          or v2 == "https://raw.githubusercontent.com/NotDSF/Lua-Serializer/main/Serializer%20Highlighting.lua" 
          or v2 == "HttpGet Request Sent To: " 
          or v2 == "A new instance was created: " 
          or v2 == "Script Analyzer" 
          or v2 == "disablehttpreq" 
          or v2 == "GetObjects Link: "
          or v2 == "https://raw.githubusercontent.com/NotDSF/leopard/main/rbx/leopard-syn.lua" 
          or v2 == "https://raw.githubusercontent.com/Introvert1337/RobloxReleases/main/Scripts/Utilities/TableFormatter.lua" 
          or v2 == "\n\nsyn.request(%s)\n\nResponse Payload: %s"
          or v2 == "\n    - URL: " -- https://raw.githubusercontent.com/topitbopit/rblx/main/http_spy.lua
          or v2 == "DEX"
          or v2 == "{} --[[DUPLICATE]]" then -- https://github.com/jheinem1/Lua-Serializer/blob/main/src/serializer.lua
            LPH_CRASH();
            while true do end;
          end;
        end;
      end;
    end;
  end;
end;

if Islclosure(Getrenv().print) then
  LPH_CRASH();
  while true do end;
end;

if Islclosure(request) then
  LPH_CRASH();
  while true do end;
end;

if EQ(Islclosure(function() end), false) then
  LPH_CRASH();
  while true do end;
end;

if not EQ(Type(Getupvalue(request, 1)), CURRENT_EXPLOIT == IDENTIFIERS.SYNAPSE and "userdata" or "nil") then
  LPH_CRASH();
  while true do end;
end;

if not EQ(Type(Getupvalue(HttpService.JSONDecode, 1)), CURRENT_EXPLOIT == IDENTIFIERS.SCRIPTWARE and "nil" or "userdata") then
  LPH_CRASH();
  while true do end;
end;

fakeJMP();

if EQ(Pcall(function() WebsocketClient.new(RandomWord(5)) end), true) then
  LPH_CRASH();
  while true do end;
end;

if EQ(Pcall(function() Getconstants(request) end), true) then
  LPH_CRASH();
  while true do end;
end;

if EQ(RandomWord(5), RandomWord(5)) then
  LPH_CRASH();
  while true do end;
end;

if not EQ(IsSynF(function() end), true) then
  LPH_CRASH();
  while true do end;
end;

-- check if people try and stop heartheat (lol)
do
  local Test = RandomWord(5);
  local Lmao;
  coroutine.wrap(function() 
    Lmao = Test;
  end)();

  if not EQ(Lmao, Test) then
    LPH_CRASH();
    while true do end;
  end;
end;

local function HashString(str) 
  local r = 0;
  for p=1, #str do
    local k = Sub(str, p, p);
    r = r + charTBL[k] + (p - 1);
  end;
  return r;
end;

local crypt = syn and syn.crypt or crypt;
local HashedSynapseID = HashString(synUserId);
local PersonalKey = math.pow(HashedSynapseID, 2) .. Sub(synUserId, 0, 5) .. math.pow(HashedSynapseID, 4);
PersonalKey = PersonalKey .. ("x"):rep(32 - #PersonalKey);

if CURRENT_EXPLOIT == IDENTIFIERS.SCRIPTWARE then
  PersonalKey = crypt.base64encode(PersonalKey);
end;

if isfile("LuaShield/bin/token.bin") and readfile("LuaShield/bin/token.bin") ~= crypt.hash(PersonalKey) then
  CrashLog(LPH_ENCSTR("x5pati9q46c7"));
  LPH_CRASH();
  while true do end;
end;

if not isfile("LuaShield/bin/token.bin") then
  writefile("LuaShield/bin/token.bin", crypt.hash(PersonalKey));
end;

local Key = rawget(getfenv(0), "Key");
if not Key then
  CrashLog(LPH_ENCSTR("1y579zofsm7s"));
  LPH_CRASH();
  while true do end;
end;

local FingerprintJSON = FingerPrint();
local Fingerprint = FingerprintJSON[1];
local NumberId, fakeSet = "", "";
local reqId, fakeReqId = "", "";

fakeConcat();

local function sortoutjsonfuckery(tbl) 
  local new = {};
  for i,v in pairs(tbl) do
    new[i + 1] = v;
  end;
  return new;
end

for i,v in pairs(sortoutjsonfuckery(FingerprintJSON[2])) do
  if Type(v) == "table" then
    v = sortoutjsonfuckery(v);
    local Length = v[3];
    if Length == 8 then -- 1
      fakeSet = fakeSet .. v[1]*2+2321;
      NumberId = NumberId .. v[1]-v[2]-v[2];
    elseif Length == 10 then -- 2
      fakeSet = fakeSet .. v[2]/2*3;
      NumberId = NumberId .. v[1]+v[2];
    elseif Length == 1 then -- 3
      fakeSet = fakeSet .. v[2]^3;
      NumberId = NumberId .. v[1];
    elseif Length == 3 then -- 4
      fakeSet = fakeSet .. v[1]+4424;
      NumberId = NumberId .. format("%d", v[1]-math.pi);
    elseif Length == 6 then -- 5
      fakeSet = fakeSet .. v[1]+-222;
      NumberId = NumberId .. format("%d", v[1]-sqrt(v[2]));
    elseif Length == 7 then
      fakeSet = fakeSet .. v[1]-v[1]+2323+v[2];
      NumberId = NumberId .. v[1]/2;
    end;
  end;
end;

do 
local _a5807a_ = "482373818bffb08265a843e9d0c46947f092f147";
    

local _a722b5_ = "756096d070bd1f0e959650320bb6206d22e185fe";
    

local _92d247_ = "05dc661cf6ff0b64d4dbc7fc2280479b2789f3b1";
    

local _cf9059_ = "1c542ba7ff95a6525f5a67e7754972c083a8cda3";
    
 end;

do
  local reqIdTable = FingerprintJSON[3];
  local encKey, reqBytes = reqIdTable["0"], reqIdTable["1"];
  local sorted = {};
  for i,v in pairs(reqBytes) do
    sorted[i + 1] = v;
  end;
  for i,v in pairs(sorted) do
    reqId = reqId .. charTBL[v - encKey - #sorted - i];
    fakeReqId = fakeReqId .. RandomWord(3);
  end;
end;

do 
local _VarA = "366835e7469ee3c9d051";
local _VarB = "6e061e507ee3d425d60e"; 
local _VARC = _VarA .. _VarA;
    

local _VarA = "cdbe27d5fe25203d52d0";
local _VarB = "ed4c5b7c263e10ed190c"; 
local _VARC = _VarA .. _VarA;
    
 end

-- A lot smarter to unpack strings after checks have occured! (will be using ce so 'unpack' applies)

local ScriptID = LPH_ENCSTR("EknsQsbbtQzKOFKyepMlewERNRarAbiFoasAyiLCZXKDzDatOBHVJcbZzEVKsOGMBhAZfPohhFQopdQctiiEvmTmUNgRtcQUdMSl");
local ServerId = LPH_ENCSTR("rsficmcZCjNyIWdpGrjVgzoNBzVakkuFGmhEjapUGvgzhkIbWyujViPlBjKjFctWmKCsSTWDhuarpRECpJefGyZfcixbyEfhVGIz");
local WebsocketId = LPH_ENCSTR("PibNiKCVCHuabRUvUfFqlcJMizJpuyOUJqeubRKduLWNQOCDjILzOwYpHXrMQSVlPLjRjgGuJVgRassCBcHtVcxYWwrsdLLxPJde");
local StackReplay = tick();
local HashStackReplay = HashString(StackReplay .. "");

-- Can't be restored from a luraph stack dump so we can check if these values exist in the main stack frame
local StackReplay2 = newproxy(true);
local StackReplay3 = Instance.new("IntValue");
StackReplay3.Name = RandomWord(10);

local Connect = 
CURRENT_EXPLOIT == IDENTIFIERS.SYNAPSE and syn.websocket.connect or
CURRENT_EXPLOIT == IDENTIFIERS.SYNAPSEV3 and WebsocketClient.new or
WebSocket.connect;

local WS, WebsocketKey = Connect("ws://localhost:8080/ws");
if CURRENT_EXPLOIT == IDENTIFIERS.SYNAPSEV3 then
  WS:Connect();
end;

WS[CURRENT_EXPLOIT == IDENTIFIERS.SYNAPSEV3 and "DataReceived" or "OnMessage"]:Connect(LPH_JIT(function(message) 
  WebsocketKey = message;
end));

WS:Send(WebsocketId);
repeat wait() until WebsocketKey;

if CURRENT_EXPLOIT == IDENTIFIERS.SYNAPSEV3 then
  WS:Disconnect();
else
  WS:Close();
end;

--local CPU_Architecture = "2"; -- dumpstring(""):byte(9, 9) < 8 and "1" or "2"; -- 1 = 32Bit, 2 = 64Bit
local Response = LS_REQUEST({
  Method = "GET",
  Url = format(LPH_ENCSTR("http://localhost:8080/auth/%s?%s=%s&%s=%s&%s=%s"), EndPoints[2], RandomWord(5), HWID, RandomWord(5), Key, RandomWord(5), RequestHash),
  Headers = {
    ["ornmprhyms"] = Fingerprint, 
    ["rnfkpggcvj"] = NumberId,
    ["thzlbitsim"] = ServerId,
    ["zafgzuyjyt"] = WebsocketKey,
    --["xabbmupvyq"] = Rot2(PCUsername or ""), -- literally just rot 2 rofl
    ["ennoczidjk"] = (tick() - TimeNow) .. "", -- Duratrion
    -- Fake Values (not needed)
    ["wkbzjadjkz"] = fakeSet, -- Fake NumberId
    ["slcrdmqaaf"] = RandomWord(10), -- fake fingerprint
    ["ftajbeeujx"] = ProjectID,
    ["yqkcgoegzy"] = ScriptIdentifier
  }
});

local LS_FASTEQ = LPH_JIT(function(a, b) return a == b end);

local WLSuccess;
--local cfRay = Response.Headers["CF-RAY"] or "";
--local cfReqId = Response.Headers["cf-request-id"] or ""; cf-request-id was removed ages ago see https://community.cloudflare.com/t/new-http-response-header-cf-request-id/165869

-- We can detect a simple jmp by setting a value in stack beforehand and then checking it in the main authentication frame
local JMPCounter = 0;

local JSONResponse = JSONDecode(Response.Body);
for _, v in pairs(JSONResponse) do
  if EQ(Type(v), "table") then
    fakeConcat();
    local WLMessage = HWID..Sub(EndPoints[2], ((-450+462)-12/LuaShield), ((129+264)-391/LuaShield))..(NumberId*((1061-863)-196/LuaShield))..Fingerprint..Sub(EndPoints[1], ((153+524)-673/LuaShield), ((877+44)-916/LuaShield))..#ServerId..synUserId; -- concat go brr
    do 
local _VarA = "8c9b2dbfade7ff3b1b9b";
local _VarB = "9b69ce674da95e1e6f8b"; 
local _VARC = _VarA .. _VarA;
    

local _VarA = "4a5bd89024e519710c79";
local _VarB = "8fb6df96bd2966dba1f0"; 
local _VARC = _VarA .. _VarA;
    

local _VarA = "8b93648308e7af2014f4";
local _VarB = "6ffa3dd3d2fe7180c580"; 
local _VARC = _VarA .. _VarA;
    
 end
    fakeConcat();
    local Message = v["0"];
    local recievedFingerprint = v["1"];
    local recievedId = v["2"];
    --local recievedFemIdentity = v[4];
    local recievedReqId = v["3"];
    --local recievedCPUArc = v[6];
    local recievedWebsocketKey = v["4"];
    local recievedProjectID = v["5"];
    local recievedRequestHash = v["6"];
    local recievedJSXToken = v["7"];
    local antiJMP = "";

    if not EQ(recievedRequestHash, RequestHash) then
      LPH_CRASH();
    end;

    if antiJMP then antiJMP = false; end;
    repeat until not antiJMP;
    
    if EQ(Message, WLMessage) then
      JMPCounter = JMPCounter + 1;
      if EQ(JSONResponse.error, false) then
        JMPCounter = JMPCounter + 1;
        if EQ(recievedFingerprint, Fingerprint) then
          JMPCounter = JMPCounter + 1;
          if EQ(recievedId, ScriptID) then
            JMPCounter = JMPCounter + 1;
            --if EQ(recievedFemIdentity, femmboyhubIdentity) then
            if EQ(recievedReqId, reqId) then
              JMPCounter = JMPCounter + 1;
              --if EQ(recievedCPUArc, CPU_Architecture) then
              if EQ(recievedWebsocketKey, HashString(WebsocketKey)) then
                if EQ(recievedProjectID, HashString(ProjectID)) then
                  JMPCounter = JMPCounter + 1;
                  exploitenv.LuaShield = false;
                
                  if antiJMP then antiJMP = false; end;
                  repeat until not antiJMP;
                  
                  if not StackReplay3 then
                    LPH_CRASH();
                    while true do end;
                  end;
  
                  if not StackReplay2 then
                    LPH_CRASH();
                    while true do end;
                  end;
  
                  if not EQ(HashString(StackReplay .. ""), HashStackReplay) then
                    LPH_CRASH();
                    while true do end;
                  end;
  
                  if tick() - StackReplay > 30 then
                    LPH_CRASH();
                    while true do end;
                  end;
  
                  if JMPCounter ~= 6 then
                    LPH_CRASH();
                    while true do end;
                  end;
  
                  if JMPCounter > 6 then
                    LPH_CRASH()
                    while true do end;
                  end;
  
                  if JMPCounter < 6 then
                    LPH_CRASH()
                    while true do end;
                  end;

                  do 
        
        
        local _c = 1
        local _d = 2

        if _c > _d then
            _pos = 0;
        end;

        if _d > _c then
            if _d < _c then
                _pos = 0;
            end;
        end;
    

        
        
        local _d = 2
        local _c = 1

        if _c > _d then
            _pos = 0;
        end;

        if _d > _c then
            if _d < _c then
                _pos = 0;
            end;
        end;
    

        
        
        local _d = 2
        local _c = 1

        if _c > _d then
            _pos = 0;
        end;

        if _d > _c then
            if _d < _c then
                _pos = 0;
            end;
        end;
    
 end
                  do 
local _Var = _pos;
    
 end
                  
                  LS_ScriptName = v["8"];
                  LS_ScriptVersion = v["9"];
                  LS_Exploit = v["10"];
                  LS_Executions = v["11"];
                  LS_CrackAttempts = v["12"];
                  LS_Username = v["13"];
                  LS_AccessToken = v["14"];

                  BackupPrint(format("LuaShield [%s]: Authenticated in %ss", LS_ScriptName, tick() - TimeNow));
                  WLSuccess = true; --UpdateGUI("Status", "Ready!", 354); wait(.25); --ScreenGui:Destroy();
                  
                  do 
    local function adde4e7d3ec17aeee568ba() end;
    adde4e7d3ec17aeee568ba();
    

    local function ac158d0b1687e1285c583a() end;
    ac158d0b1687e1285c583a();
    

    local function af92e4f97d9f1a3be02fea() end;
    af92e4f97d9f1a3be02fea();
    

    local function a17d74bfed552ddd31ddba() end;
    a17d74bfed552ddd31ddba();
    

    local function aa4c87eaa19e8ce0e9acca() end;
    aa4c87eaa19e8ce0e9acca();
    

    local function aaa6c98780e3afde0aff2a() end;
    aaa6c98780e3afde0aff2a();
    

    local function a5d78e06ccddd5a8fdb0ca() end;
    a5d78e06ccddd5a8fdb0ca();
    
 end;
                  (function(...) 
                    do 
        
        local _c = 1
        local _d = 2
        

        if _c > _d then
            _pos = 0;
        end;

        if _d > _c then
            if _d < _c then
                _pos = 0;
            end;
        end;
    
 end
                    do 
local _Var = _pos;
    

local _Var = _pos;
    

local _Var = _pos;
    

local _Var = _pos;
    
 end
                    do 
    local function afee1d2206d3b0d7b320ba() end;
    afee1d2206d3b0d7b320ba();
    

    local function ab9a9def878e10ee065b2a() end;
    ab9a9def878e10ee065b2a();
    

    local function a111864d38d53eb4055e2a() end;
    a111864d38d53eb4055e2a();
    

    local function aa81f03266d89ef05d131a() end;
    aa81f03266d89ef05d131a();
    

    local function a183840ba72313edc445fa() end;
    a183840ba72313edc445fa();
    

    local function af27ad889533629c88a64a() end;
    af27ad889533629c88a64a();
    
 end
                    do
                      local Word = RandomWord2();
                      if not EQ(Word, Word) then
                        LPH_CRASH();
                      end;
                    
                      if not StackReplay3 then
                        LPH_CRASH();
                      end;
                    
                      if not StackReplay2 then
                        LPH_CRASH();
                      end;
                    
                      if tick() - StackReplay > 30 then
                        LPH_CRASH();
                        while true do end;
                      end;
                      
                      do 
    local function a25cf69e58c2fd202f223a() end;
    a25cf69e58c2fd202f223a();
    

    local function a17a890f3987cc26e80caa() end;
    a17a890f3987cc26e80caa();
    

    local function a85393780b6abe552a037a() end;
    a85393780b6abe552a037a();
    

    local function abc07d78782d5e91de269a() end;
    abc07d78782d5e91de269a();
    

    local function a116a2f3bb0ad31e60805a() end;
    a116a2f3bb0ad31e60805a();
    

    local function a6188524b13b1cba4011fa() end;
    a6188524b13b1cba4011fa();
    

    local function ae3b24b79fa2187d1d9d0a() end;
    ae3b24b79fa2187d1d9d0a();
    

    local function a22839020ec651ecb549ca() end;
    a22839020ec651ecb549ca();
    
 end

                      if JMPCounter ~= 6 then
                        LPH_CRASH();
                        while true do end;
                      end;
                    
                      if JMPCounter > 6 then
                        LPH_CRASH()
                        while true do end;
                      end;
                    
                      if JMPCounter < 6 then
                        LPH_CRASH()
                        while true do end;
                      end;

                      if not LS_FASTEQ("a", "a") then
                        LPH_CRASH();
                      end;

                      Response = nil;
                      JSONResponse = nil;
                      FingerprintJSON = nil;
                      Fingerprint = nil;
                      NumberId = nil;
                      reqId = nil;
                      PersonalKey = nil;
                      RequestHash = nil;
                      decodeString = nil;
                      do 
    local function a337dbfdf93504033a9aea() end;
    a337dbfdf93504033a9aea();
    

    local function a1567675458d6a100f105a() end;
    a1567675458d6a100f105a();
    

    local function a671c5e5be3278b87af73a() end;
    a671c5e5be3278b87af73a();
    

    local function a13f2d28883621d610d55a() end;
    a13f2d28883621d610d55a();
    
 end
                      HashString = nil;
                      ScriptID = nil;
                      ServerId = nil;
                      WebsocketId = nil;
                      WLMessage = nil;
                      Message = nil;
                      recievedFingerprint = nil;
                      recievedId = nil;
                      recievedReqId = nil;
                      recievedWebsocketKey = nil;
                      recievedProjectID = nil;
                      recievedRequestHash = nil;
                    end;

                    coroutine.wrap(function() 
                      local Request = LS_REQUEST;
                      local DecodeJSON = JSONDecode;
                      JSONDecode = nil;
                      LS_REQUEST = request;

                      while wait(10) do
                        local Response = Request({
                          Method = "GET",
                          Url = "http://localhost:8080/auth/v/" .. recievedJSXToken
                        });

                        if Response.StatusCode ~= 200 then
                          LPH_CRASH();
                        end;

                        if Response.Body == "" then
                          LPH_CRASH();
                        end;

                        local Data = DecodeJSON(Response.Body);
                        if Data.Version ~= whitelistVersion then
                          LPH_CRASH();
                          while true do end;
                        end;

                        recievedJSXToken = Data.Token;
                      end;
                    end)();

                    (fakeJMP and print)("Hello World")
                  end)();
                  do 
    local function a4864379aec91ad780aeea() end;
    a4864379aec91ad780aeea();
    

    local function a5cc5d4f56620af2bcd01a() end;
    a5cc5d4f56620af2bcd01a();
    

    local function ada0495a93132ab99b613a() end;
    ada0495a93132ab99b613a();
    

    local function ac9b1c78dfa08cad99e4aa() end;
    ac9b1c78dfa08cad99e4aa();
    

    local function a2dec3e7b8d02c62515cea() end;
    a2dec3e7b8d02c62515cea();
    
 end;
                end;
              end;
            end;
          end;
        end;
      end;
    end;
  elseif EQ(_, LPH_ENCSTR("JSONHWID")) and not EQ(v, HWID) then
    CrashLog(LPH_ENCSTR("cb5wk0sauvs6"));
    LPH_CRASH();
    while true do end;
  end;
end;

if not WLSuccess then
  LPH_CRASH();
end;