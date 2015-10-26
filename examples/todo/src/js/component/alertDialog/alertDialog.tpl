<template name="alertDialog">
	<div class="component-modal-dialog">
		<div class="mask"></div>
		<div class="dialog">
			<div class="modal-head">
				<div class="title">{{title}}</div>
				<div class="close-button">×</div>
			</div>
			<div class="modal-body">
				<div class="component-alert-content">
					{{>transclude}}
				</div>
			</div>
		</div>
	</div>
</template>