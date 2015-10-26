<template name="todoItem">
	<li class="component-list-item">
		<div class="row state-{{state}}">
			<span class="col-9">{{text}}</span>
			<span class="col-3 cc list-item-time">{{time|time}}</span>
		</div>
	</li>
</template>