<?xml version="1.0" encoding="UTF-8"?>
<tileset name="IWBTGTiles" tilewidth="32" tileheight="32" tilecount="15" columns="0">
 <grid orientation="orthogonal" width="1" height="1"/>
 <tile id="0" type="floor">
  <image width="32" height="32" source="floor5.png"/>
  <objectgroup draworder="index">
   <object id="3" x="0" y="0" width="32" height="32"/>
  </objectgroup>
 </tile>
 <tile id="1" type="floor">
  <image width="32" height="32" source="floor4.png"/>
  <objectgroup draworder="index">
   <object id="2" x="0" y="0" width="32" height="32"/>
  </objectgroup>
 </tile>
 <tile id="2" type="floor">
  <image width="32" height="32" source="floor3.png"/>
  <objectgroup draworder="index">
   <object id="1" x="0" y="0" width="32" height="32"/>
  </objectgroup>
 </tile>
 <tile id="3" type="floor">
  <image width="32" height="32" source="floor2.png"/>
  <objectgroup draworder="index">
   <object id="1" x="0" y="0" width="32" height="32"/>
  </objectgroup>
 </tile>
 <tile id="4" type="floor">
  <image width="32" height="32" source="floor1.png"/>
  <objectgroup draworder="index">
   <object id="1" x="0" y="0" width="32" height="32"/>
  </objectgroup>
 </tile>
 <tile id="5" type="savePoint">
  <image width="32" height="32" source="IWBTGsave2.png"/>
  <objectgroup draworder="index">
   <properties>
    <property name="ControllerName" value="SavePoint"/>
   </properties>
   <object id="1" x="7" y="13" width="15" height="15">
    <ellipse/>
   </object>
  </objectgroup>
 </tile>
 <tile id="6" type="savePoint">
  <image width="32" height="32" source="IWBTGsave1.png"/>
  <objectgroup draworder="index">
   <properties>
    <property name="ControllerName" value="SavePoint"/>
   </properties>
   <object id="1" x="7" y="13" width="15" height="15">
    <ellipse/>
   </object>
  </objectgroup>
 </tile>
 <tile id="7" type="savePoint">
  <image width="32" height="32" source="IWBTGwuss2.png"/>
  <objectgroup draworder="index">
   <properties>
    <property name="ControllerName" value="WussController"/>
   </properties>
   <object id="1" x="7" y="13" width="15" height="15">
    <ellipse/>
   </object>
  </objectgroup>
 </tile>
 <tile id="8" type="savePoint">
  <image width="32" height="32" source="IWBTGwuss1.png"/>
  <objectgroup draworder="index">
   <properties>
    <property name="ControllerName" value="WussController"/>
   </properties>
   <object id="1" x="7" y="13" width="15" height="15">
    <ellipse/>
   </object>
  </objectgroup>
 </tile>
 <tile id="9" type="trap">
  <image width="32" height="32" source="evil.png"/>
 </tile>
 <tile id="10" type="trap">
  <image width="32" height="32" source="nailUp.png"/>
  <objectgroup draworder="index">
   <properties>
    <property name="ControllerName" value="nailController"/>
   </properties>
   <object id="1" x="0" y="32">
    <polygon points="1,-1 31,-1 16,-32"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="11" type="trap">
  <properties>
   <property name="ControllerName" value="nailController"/>
  </properties>
  <image width="32" height="32" source="nailRight.png"/>
  <objectgroup draworder="index">
   <properties>
    <property name="ControllerName" value="nailController"/>
   </properties>
   <object id="1" x="0" y="0">
    <polygon points="1,1 1,31 32,16"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="12">
  <image width="32" height="32" source="hole.png"/>
  <objectgroup draworder="index"/>
 </tile>
 <tile id="13">
  <image width="32" height="32" source="nailLeft.png"/>
  <objectgroup draworder="index">
   <properties>
    <property name="ControllerName" value="nailController"/>
   </properties>
   <object id="2" x="32" y="0">
    <polygon points="-1,1 -32,16 -1,31"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="14">
  <image width="32" height="32" source="nailDown.png"/>
  <objectgroup draworder="index">
   <properties>
    <property name="ControllerName" value="nailController"/>
   </properties>
   <object id="1" x="0" y="0">
    <polygon points="1,1 31,1 16,32"/>
   </object>
  </objectgroup>
 </tile>
</tileset>
